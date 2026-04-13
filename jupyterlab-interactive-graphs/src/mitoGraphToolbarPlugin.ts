/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';

import '../style/mitoGraphToolbar.css';

const HOST_CLASS = 'jp-MitoGraphToolbar-host';
const MARK_ATTR = 'data-jp-mito-graph-toolbar';

/** Opens the Mito AI chat; registered by mito-ai when that extension is installed. */
const MITO_AI_OPEN_CHAT = 'mito_ai:open-chat';

function findNotebookPanelContaining(
  notebooks: INotebookTracker,
  el: HTMLElement
): NotebookPanel | null {
  let found: NotebookPanel | null = null;
  notebooks.forEach(panel => {
    if (panel.node.contains(el)) {
      found = panel;
    }
  });
  return found;
}

/**
 * Heuristic: does this output area child look like a chart / figure?
 * Covers Plotly, ipympl, Bokeh, Vega-Lite/Altair, static PNG/SVG, etc.
 */
function looksLikeGraphOutput(root: HTMLElement): boolean {
  if (
    root.querySelector(
      '.plotly-graph-div, .js-plotly-plot, [class*="plotly"]'
    )
  ) {
    return true;
  }
  if (
    root.querySelector(
      '.jupyter-matplotlib, .jupyter-matplotlib-figure, .jupyter-matplotlib-canvas-div'
    )
  ) {
    return true;
  }
  if (root.querySelector('.bk-root, .bk-canvas, [class*="bk-"]')) {
    return true;
  }
  if (root.querySelector('.vega-embed, [class*="vega"]')) {
    return true;
  }
  if (root.querySelector('.jp-RenderedImage')) {
    return true;
  }
  if (root.querySelector('.jp-RenderedSVG')) {
    return true;
  }
  return false;
}

function insertMitoToolbar(
  host: HTMLElement,
  app: JupyterFrontEnd,
  notebooks: INotebookTracker
): void {
  if (host.querySelector('.jp-MitoGraphToolbar')) {
    return;
  }
  host.classList.add(HOST_CLASS);
  const tb = document.createElement('aside');
  tb.className = 'jp-MitoGraphToolbar';
  tb.setAttribute('role', 'button');
  tb.setAttribute('tabindex', '0');
  tb.setAttribute(
    'aria-label',
    'Ask Mito AI about this graph. Opens the Mito AI chat.'
  );

  const inner = document.createElement('div');
  inner.className = 'jp-MitoGraphToolbar-inner';

  const logo = document.createElement('span');
  logo.className = 'jp-MitoGraphToolbar-logo';
  logo.textContent = 'Mito';

  const tag = document.createElement('span');
  tag.className = 'jp-MitoGraphToolbar-tag';
  tag.textContent = 'Graph';

  inner.appendChild(logo);
  inner.appendChild(tag);
  tb.appendChild(inner);

  const openMitoAiChat = (): void => {
    const panel = findNotebookPanelContaining(notebooks, tb);
    if (panel) {
      void app.shell.activateById(panel.id);
    }
    void app.commands.execute(MITO_AI_OPEN_CHAT).catch(() => {
      /* mito-ai not installed or command unavailable */
    });
  };

  tb.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    openMitoAiChat();
  });

  tb.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      openMitoAiChat();
    }
  });

  const prompt = host.querySelector('.jp-OutputArea-prompt');
  if (prompt) {
    prompt.insertAdjacentElement('afterend', tb);
  } else {
    host.insertBefore(tb, host.firstChild);
  }
}

function scanNotebookOutputs(
  root: HTMLElement,
  app: JupyterFrontEnd,
  notebooks: INotebookTracker
): void {
  root.querySelectorAll('.jp-OutputArea-child').forEach(node => {
    const el = node as HTMLElement;
    if (el.getAttribute(MARK_ATTR) === '1') {
      return;
    }
    if (!looksLikeGraphOutput(el)) {
      return;
    }
    el.setAttribute(MARK_ATTR, '1');
    insertMitoToolbar(el, app, notebooks);
  });
}

function watchNotebookPanel(
  panel: NotebookPanel,
  app: JupyterFrontEnd,
  notebooks: INotebookTracker
): void {
  let timer: number | null = null;
  const schedule = (): void => {
    if (timer !== null) {
      window.clearTimeout(timer);
    }
    timer = window.setTimeout(() => {
      timer = null;
      scanNotebookOutputs(panel.node, app, notebooks);
    }, 80);
  };

  schedule();
  const mo = new MutationObserver(() => {
    schedule();
  });
  mo.observe(panel.node, { childList: true, subtree: true });
}

/**
 * Injects a small Mito-branded toolbar beside any graph-like cell output.
 */
export const mitoGraphToolbarPlugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-interactive-graphs:mito-graph-toolbar',
  description: 'Mito toolbar beside Plotly, Matplotlib, Vega, Bokeh, and image figure outputs',
  requires: [INotebookTracker],
  autoStart: true,
  activate: (app: JupyterFrontEnd, notebooks: INotebookTracker): void => {
    const hook = (panel: NotebookPanel): void => {
      watchNotebookPanel(panel, app, notebooks);
    };

    notebooks.widgetAdded.connect((_, panel) => {
      hook(panel);
    });

    notebooks.forEach(panel => {
      hook(panel);
    });
  }
};
