/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

/**
 * In Document mode, adds a hover "View code" control on each code cell output so users
 * can jump to Notebook mode at that cell without relying on double-click (which was too
 * easy to trigger accidentally).
 */

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { CodeCell } from '@jupyterlab/cells';
import { NotebookPanel } from '@jupyterlab/notebook';
import { IDisposable } from '@lumino/disposable';
import TextAndIconButton from '../../components/TextAndIconButton';
import CodeIcon from '../../icons/CodeIcon';

const VIEW_CODE_BUTTON_CLASS = 'document-mode-view-code-button-container';
const VIEW_CODE_OUTPUT_HOVER_CLASS = 'document-mode-view-code-output-container';
const OUTPUT_MUTATION_SELECTOR = '.jp-Cell-outputWrapper, .jp-Cell-outputArea, .jp-OutputArea-output';

interface DocumentViewCodeButtonProps {
  onClick: () => void;
}

const DocumentViewCodeButton: React.FC<DocumentViewCodeButtonProps> = ({ onClick }) => {
  return (
    <TextAndIconButton
      icon={CodeIcon}
      text="View code"
      title="Open notebook view at this cell"
      onClick={onClick}
      variant="purple"
      width="fit-contents"
      iconPosition="left"
    />
  );
};

function isRelevantOutputMutationNode(node: Node): boolean {
  if (!(node instanceof HTMLElement)) {
    return false;
  }

  if (node.classList.contains(VIEW_CODE_BUTTON_CLASS) || node.closest(`.${VIEW_CODE_BUTTON_CLASS}`)) {
    return false;
  }

  return node.matches(OUTPUT_MUTATION_SELECTOR) || !!node.querySelector(OUTPUT_MUTATION_SELECTOR);
}

function hasRelevantOutputMutation(mutations: MutationRecord[]): boolean {
  return mutations.some((mutation) => Array.from(mutation.addedNodes).some(isRelevantOutputMutationNode));
}

export class DocumentModeViewCodeButtons implements IDisposable {
  private readonly _panel: NotebookPanel;
  private readonly _onViewCodeForCell: (cellId: string) => void;
  private readonly _roots = new Map<HTMLElement, Root>();
  private _observer: MutationObserver | null = null;
  private _disposePanelHook: (() => void) | null = null;
  private _injectScheduled = false;
  private _isDisposed = false;

  constructor(panel: NotebookPanel, onViewCodeForCell: (cellId: string) => void) {
    this._panel = panel;
    this._onViewCodeForCell = onViewCodeForCell;
  }

  get panel(): NotebookPanel {
    return this._panel;
  }

  attach(): void {
    const revealed = this._panel.revealed ?? Promise.resolve();
    void revealed
      .then(() => {
        if (this._isDisposed) {
          return;
        }
        this._injectAll();
        this._startObserver();
        this._disposePanelHook = (): void => {
          this.dispose();
        };
        this._panel.disposed.connect(this._disposePanelHook);
      })
      .catch(() => {});
  }

  dispose(): void {
    if (this._isDisposed) {
      return;
    }
    this._isDisposed = true;

    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }

    if (this._disposePanelHook) {
      this._panel.disposed.disconnect(this._disposePanelHook);
      this._disposePanelHook = null;
    }

    const wrappersToClean = new Set<HTMLElement>();
    const entries = [...this._roots.entries()];
    entries.forEach(([container, root]) => {
      const parent = container.parentElement;
      if (parent) {
        wrappersToClean.add(parent);
      }
      root.unmount();
      container.remove();
    });
    this._roots.clear();

    wrappersToClean.forEach((w) => {
      w.classList.remove(VIEW_CODE_OUTPUT_HOVER_CLASS);
    });
  }

  get isDisposed(): boolean {
    return this._isDisposed;
  }

  private _injectViewCodeButton(cell: CodeCell): void {
    const outputWrapper = cell.node.querySelector('.jp-Cell-outputWrapper') as HTMLElement | null;
    if (!outputWrapper) {
      return;
    }

    if (outputWrapper.querySelector(`.${VIEW_CODE_BUTTON_CLASS}`)) {
      return;
    }

    outputWrapper.style.position = 'relative';
    outputWrapper.classList.add(VIEW_CODE_OUTPUT_HOVER_CLASS);

    const container = document.createElement('div');
    container.className = VIEW_CODE_BUTTON_CLASS;

    const cellId = cell.model.id;
    const root = createRoot(container);
    this._roots.set(container, root);
    root.render(
      <DocumentViewCodeButton
        onClick={() => {
          this._onViewCodeForCell(cellId);
        }}
      />
    );

    outputWrapper.appendChild(container);
  }

  private _pruneStaleRoots(): void {
    for (const [container, root] of [...this._roots.entries()]) {
      if (!this._panel.content.node.contains(container)) {
        const parent = container.parentElement;
        root.unmount();
        this._roots.delete(container);
        if (parent) {
          parent.classList.remove(VIEW_CODE_OUTPUT_HOVER_CLASS);
        }
      }
    }
  }

  private _injectAll(): void {
    if (this._isDisposed) {
      return;
    }
    this._pruneStaleRoots();
    for (const cell of this._panel.content.widgets) {
      if (cell instanceof CodeCell && cell.outputArea?.model.length) {
        this._injectViewCodeButton(cell);
      }
    }
  }

  private _scheduleInjectAll(): void {
    if (this._injectScheduled) {
      return;
    }
    this._injectScheduled = true;
    requestAnimationFrame(() => {
      this._injectScheduled = false;
      if (!this._isDisposed) {
        this._injectAll();
      }
    });
  }

  private _startObserver(): void {
    if (this._isDisposed || this._observer) {
      return;
    }
    this._observer = new MutationObserver((mutations) => {
      if (!hasRelevantOutputMutation(mutations)) {
        return;
      }
      this._scheduleInjectAll();
    });
    this._observer.observe(this._panel.content.node, { childList: true, subtree: true });
  }
}
