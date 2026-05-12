/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { NotebookPanel } from '@jupyterlab/notebook';
import { Kernel } from '@jupyterlab/services';
import { IDisposable } from '@lumino/disposable';
import {
  findCodeCellIndexForWidgetModelId,
  findNotebookCellIndexContainingDomNode
} from './documentReactiveOrigin';
import { runAllCellsStrictlyBelow } from '../../utils/notebook';

/** Debounce window (ms) after widget traffic before running downstream cells. */
const DEBOUNCE_MS = 400;

/**
 * ipywidgets sends many client→kernel `comm_msg`s (focus, layout, custom views, etc.).
 * Downstream refresh should react to **trait updates** only: `method: 'update'` with state.
 * Otherwise opening a DatePicker calendar can look like a "value change" at the comm layer
 * and will spam `runAllCellsStrictlyBelow`, which overloads execution and can desync the UI.
 */
export function isIpywidgetsTraitUpdateCommContent(content: {
  comm_id?: string;
  data?: unknown;
}): boolean {
  const raw = content.data;
  if (!raw || typeof raw !== 'object') {
    return false;
  }
  const data = raw as { method?: unknown; state?: unknown };
  if (data.method !== 'update') {
    return false;
  }
  return typeof data.state === 'object' && data.state !== null;
}

/**
 * When the user interacts with ipywidgets in Document mode, re-execute all cells
 * strictly below the cell that owns the widget, so the defining cell is not reset.
 *
 * Origin is resolved from DOM (`change` / `input` in outputs) or from shell `comm_msg`
 * (`method: 'update'` only) by matching `comm_id` to widget view `model_id` in cell outputs.
 */
export class DocumentReactiveRunner implements IDisposable {
  private _panel: NotebookPanel;
  private readonly _isDocumentMode: () => boolean;
  private _kernelHandler: ((sender: Kernel.IKernelConnection, args: Kernel.IAnyMessageArgs) => void) | null =
    null;
  private _kernelChangedHandler: (() => void) | null = null;
  private _disposePanelHook: (() => void) | null = null;
  private _domHandler: ((event: Event) => void) | null = null;
  private _debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private _pendingOriginIndex: number | null = null;
  /** Origin to debounce-schedule after the current downstream run finishes (coalesce in-flight interactions). */
  private _pendingRefreshAfterRunOrigin: number | null = null;
  private _reactiveRunInProgress = false;
  private _isDisposed = false;

  constructor(panel: NotebookPanel, isDocumentMode: () => boolean) {
    this._panel = panel;
    this._isDocumentMode = isDocumentMode;
  }

  attach(): void {
    this._bindKernel();
    this._bindDom();
    this._disposePanelHook = (): void => {
      this.dispose();
    };
    this._panel.disposed.connect(this._disposePanelHook);
    const sessionContext = this._panel.context.sessionContext;
    if (sessionContext) {
      this._kernelChangedHandler = (): void => {
        this._unbindKernel();
        this._bindKernel();
      };
      sessionContext.kernelChanged.connect(this._kernelChangedHandler);
    }
  }

  dispose(): void {
    if (this._isDisposed) {
      return;
    }
    this._isDisposed = true;
    if (this._debounceTimer !== null) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }
    this._pendingOriginIndex = null;
    this._pendingRefreshAfterRunOrigin = null;
    if (this._disposePanelHook) {
      this._panel.disposed.disconnect(this._disposePanelHook);
      this._disposePanelHook = null;
    }
    const sessionContext = this._panel.context.sessionContext;
    if (this._kernelChangedHandler && sessionContext) {
      sessionContext.kernelChanged.disconnect(this._kernelChangedHandler);
      this._kernelChangedHandler = null;
    }
    this._unbindKernel();
    this._unbindDom();
  }

  get isDisposed(): boolean {
    return this._isDisposed;
  }

  /** Notebook panel this runner was constructed for (for dispose on panel close). */
  get panel(): NotebookPanel {
    return this._panel;
  }

  private _bindDom(): void {
    const node = this._panel.content.node;
    this._domHandler = (event: Event): void => {
      if (!this._isDocumentMode()) {
        return;
      }
      if (event.type !== 'change' && event.type !== 'input') {
        return;
      }
      const target = event.target as HTMLElement | undefined;
      if (!target?.closest?.('.jp-OutputArea')) {
        return;
      }
      const origin = findNotebookCellIndexContainingDomNode(
        this._panel.content,
        event.target
      );
      if (origin === null) {
        return;
      }
      if (this._reactiveRunInProgress) {
        this._pendingRefreshAfterRunOrigin = origin;
        return;
      }
      this._scheduleRefreshFromOrigin(origin);
    };
    node.addEventListener('change', this._domHandler, true);
    node.addEventListener('input', this._domHandler, true);
  }

  private _unbindDom(): void {
    if (!this._domHandler) {
      return;
    }
    const node = this._panel.content.node;
    node.removeEventListener('change', this._domHandler, true);
    node.removeEventListener('input', this._domHandler, true);
    this._domHandler = null;
  }

  private _bindKernel(): void {
    const sessionContext = this._panel.context.sessionContext;
    const kernel = sessionContext?.session?.kernel;
    if (!kernel) {
      return;
    }
    this._kernelHandler = (
      _sender: Kernel.IKernelConnection,
      args: Kernel.IAnyMessageArgs
    ): void => {
      if (!this._isDocumentMode()) {
        return;
      }
      if (args.direction !== 'send') {
        return;
      }
      const msg = args.msg;
      if (msg.channel !== 'shell' || msg.header.msg_type !== 'comm_msg') {
        return;
      }
      const content = msg.content as { comm_id?: string; data?: unknown };
      const commId = content.comm_id;
      if (!commId || !isIpywidgetsTraitUpdateCommContent(content)) {
        return;
      }
      const origin = findCodeCellIndexForWidgetModelId(this._panel.content, commId);
      if (origin === null) {
        return;
      }
      if (this._reactiveRunInProgress) {
        this._pendingRefreshAfterRunOrigin = origin;
        return;
      }
      this._scheduleRefreshFromOrigin(origin);
    };
    kernel.anyMessage.connect(this._kernelHandler);
  }

  private _unbindKernel(): void {
    const sessionContext = this._panel.context.sessionContext;
    const kernel = sessionContext?.session?.kernel;
    if (kernel && this._kernelHandler) {
      kernel.anyMessage.disconnect(this._kernelHandler);
    }
    this._kernelHandler = null;
  }

  private _scheduleRefreshFromOrigin(originIndex: number): void {
    this._pendingOriginIndex = originIndex;
    if (this._debounceTimer !== null) {
      clearTimeout(this._debounceTimer);
    }
    this._debounceTimer = setTimeout(() => {
      this._debounceTimer = null;
      void this._flushRefresh();
    }, DEBOUNCE_MS);
  }

  private async _flushRefresh(): Promise<void> {
    const origin = this._pendingOriginIndex;
    this._pendingOriginIndex = null;
    if (origin === null || !this._isDocumentMode() || this._reactiveRunInProgress) {
      return;
    }
    const notebook = this._panel.content;
    if (origin < 0 || origin >= notebook.widgets.length) {
      return;
    }
    this._reactiveRunInProgress = true;
    try {
      await runAllCellsStrictlyBelow(
        notebook,
        origin,
        this._panel.context.sessionContext
      );
    } finally {
      this._reactiveRunInProgress = false;
      const deferredOrigin = this._pendingRefreshAfterRunOrigin;
      this._pendingRefreshAfterRunOrigin = null;
      if (
        deferredOrigin !== null &&
        this._isDocumentMode() &&
        !this._isDisposed
      ) {
        this._scheduleRefreshFromOrigin(deferredOrigin);
      }
    }
  }
}
