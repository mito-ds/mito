/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

/**
 * In Document mode, adds hover "View code" (and output-style "Comment" for markdown)
 * on code outputs and rendered markdown so users can jump to Notebook mode or comment
 * for the AI. Not injected in Notebook mode — output comments for code cells are
 * hidden outside Document mode via Comments.css.
 */

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { CodeCell, MarkdownCell } from '@jupyterlab/cells';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { IDisposable } from '@lumino/disposable';
import { mountOutputCommentButtonOnHost } from '../Comments/CommentsPlugin';
import TextAndIconButton from '../../components/TextAndIconButton';
import CodeIcon from '../../icons/CodeIcon';

const VIEW_CODE_BUTTON_CLASS = 'document-mode-view-code-button-container';
const VIEW_CODE_OUTPUT_HOVER_CLASS = 'document-mode-view-code-output-container';
const OUTPUT_MUTATION_SELECTOR =
  '.jp-Cell-outputWrapper, .jp-Cell-outputArea, .jp-OutputArea-output, .jp-MarkdownOutput, .jp-MarkdownCell';

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

  if (
    node.classList.contains(VIEW_CODE_BUTTON_CLASS) ||
    node.closest(`.${VIEW_CODE_BUTTON_CLASS}`) ||
    node.classList.contains('output-comment-button-container') ||
    node.closest('.output-comment-button-container')
  ) {
    return false;
  }

  return node.matches(OUTPUT_MUTATION_SELECTOR) || !!node.querySelector(OUTPUT_MUTATION_SELECTOR);
}

function hasRelevantOutputMutation(mutations: MutationRecord[]): boolean {
  return mutations.some((mutation) => Array.from(mutation.addedNodes).some(isRelevantOutputMutationNode));
}

export class DocumentModeViewCodeButtons implements IDisposable {
  private readonly _panel: NotebookPanel;
  private readonly _app: JupyterFrontEnd;
  private readonly _notebookTracker: INotebookTracker;
  private readonly _onViewCodeForCell: (cellId: string) => void;
  private readonly _roots = new Map<HTMLElement, Root>();
  private readonly _markdownCommentRoots = new Map<HTMLElement, Root>();
  private _observer: MutationObserver | null = null;
  private _disposePanelHook: (() => void) | null = null;
  private _injectScheduled = false;
  private _isDisposed = false;

  constructor(
    panel: NotebookPanel,
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    onViewCodeForCell: (cellId: string) => void
  ) {
    this._panel = panel;
    this._app = app;
    this._notebookTracker = notebookTracker;
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

    this._markdownCommentRoots.forEach((root, host) => {
      root.unmount();
      host.querySelector('.output-comment-button-container')?.remove();
      host.classList.remove('output-comment-output-container');
    });
    this._markdownCommentRoots.clear();

    wrappersToClean.forEach((w) => {
      w.classList.remove(VIEW_CODE_OUTPUT_HOVER_CLASS);
    });
  }

  get isDisposed(): boolean {
    return this._isDisposed;
  }

  private _injectViewCodeButtonOnHost(host: HTMLElement, cellId: string): void {
    if (host.querySelector(`.${VIEW_CODE_BUTTON_CLASS}`)) {
      return;
    }

    host.style.position = 'relative';
    host.classList.add(VIEW_CODE_OUTPUT_HOVER_CLASS);

    const container = document.createElement('div');
    container.className = VIEW_CODE_BUTTON_CLASS;

    const root = createRoot(container);
    this._roots.set(container, root);
    root.render(
      <DocumentViewCodeButton
        onClick={() => {
          this._onViewCodeForCell(cellId);
        }}
      />
    );

    host.appendChild(container);
  }

  private _injectCodeCellViewCode(cell: CodeCell): void {
    const outputWrapper = cell.node.querySelector('.jp-Cell-outputWrapper') as HTMLElement | null;
    if (!outputWrapper) {
      return;
    }
    this._injectViewCodeButtonOnHost(outputWrapper, cell.model.id);
  }

  private _injectMarkdownDocumentActions(cell: MarkdownCell): void {
    const host = cell.node.querySelector('.jp-MarkdownOutput') as HTMLElement | null;
    if (!host) {
      return;
    }

    this._injectViewCodeButtonOnHost(host, cell.model.id);

    const commentRoot = mountOutputCommentButtonOnHost(
      host,
      cell.model.id,
      this._app,
      this._notebookTracker
    );
    if (commentRoot) {
      this._markdownCommentRoots.set(host, commentRoot);
    }
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

    for (const [host, root] of [...this._markdownCommentRoots.entries()]) {
      if (!this._panel.content.node.contains(host)) {
        root.unmount();
        host.querySelector('.output-comment-button-container')?.remove();
        host.classList.remove('output-comment-output-container');
        this._markdownCommentRoots.delete(host);
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
        this._injectCodeCellViewCode(cell);
      } else if (cell instanceof MarkdownCell) {
        this._injectMarkdownDocumentActions(cell);
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
