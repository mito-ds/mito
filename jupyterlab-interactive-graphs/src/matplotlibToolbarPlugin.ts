/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';

import '../style/index.css';

const TOOLBAR_ENHANCE_CLASS = 'jp-InteractiveGraphs-mplToolbar';

function enhanceMatplotlibToolbars(root: ParentNode = document): void {
  root.querySelectorAll('.jupyter-matplotlib-toolbar').forEach(el => {
    el.classList.add(TOOLBAR_ENHANCE_CLASS);
  });
}

/**
 * Restyles ipympl’s native Matplotlib toolbar (see style/index.css).
 */
export const matplotlibToolbarPlugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-interactive-graphs:matplotlib-toolbar-style',
  description: 'Improved Matplotlib (ipympl) toolbar styling',
  autoStart: true,
  activate: (_app: JupyterFrontEnd): void => {
    enhanceMatplotlibToolbars();

    const observer = new MutationObserver(mutations => {
      for (const m of mutations) {
        for (const n of Array.from(m.addedNodes)) {
          if (n instanceof Element) {
            if (n.matches('.jupyter-matplotlib-toolbar')) {
              n.classList.add(TOOLBAR_ENHANCE_CLASS);
            }
            enhanceMatplotlibToolbars(n);
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
};
