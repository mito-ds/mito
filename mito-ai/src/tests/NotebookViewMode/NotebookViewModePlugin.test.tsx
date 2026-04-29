/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { NotebookViewModeManager, DOCUMENT_MODE_CSS_CLASS } from '../../Extensions/NotebookViewMode/NotebookViewModePlugin';
import { IStreamlitPreviewManager } from '../../Extensions/AppPreview/StreamlitPreviewPlugin';

jest.mock('../../../../style/DocumentMode.css', () => ({}));

function createMockNotebookPanel(id: string): NotebookPanel {
  const panel = {
    id,
    toolbar: {
      hide: jest.fn()
    },
    content: {
      show: jest.fn(),
      hide: jest.fn(),
      node: document.createElement('div'),
      widgets: []
    },
    context: {
      path: '/test/notebook.ipynb',
      save: jest.fn().mockResolvedValue(undefined)
    },
    layout: {
      addWidget: jest.fn()
    },
    disposed: {
      connect: jest.fn()
    }
  } as unknown as NotebookPanel;

  return panel;
}

function createMockDependencies(panel: NotebookPanel) {
  const currentChangedCallbacks: Array<() => void> = [];
  const mockNotebookTracker = {
    currentWidget: panel,
    currentChanged: {
      connect: jest.fn((cb: () => void) => {
        currentChangedCallbacks.push(cb);
      })
    }
  } as unknown as INotebookTracker;

  const mockStreamlitPreviewManager = {
    startPreview: jest.fn(),
    stopPreview: jest.fn(),
    editPreview: jest.fn()
  } as unknown as IStreamlitPreviewManager;

  return {
    mockNotebookTracker,
    mockStreamlitPreviewManager,
    triggerCurrentChanged: () => {
      currentChangedCallbacks.forEach(cb => cb());
    }
  };
}

describe('NotebookViewModeManager', () => {
  it('always hides native notebook toolbar', () => {
    const panel = createMockNotebookPanel('test-panel-1');
    const deps = createMockDependencies(panel);
    const manager = new NotebookViewModeManager(
      deps.mockNotebookTracker,
      deps.mockStreamlitPreviewManager
    );

    manager.setupNotebookPanel(panel);

    expect(panel.toolbar.hide).toHaveBeenCalled();
  });

  it('switches to document mode and toggles document class', () => {
    const panel = createMockNotebookPanel('test-panel-1');
    const deps = createMockDependencies(panel);
    const manager = new NotebookViewModeManager(
      deps.mockNotebookTracker,
      deps.mockStreamlitPreviewManager
    );

    manager.setMode('Document');

    expect(panel.content.show).toHaveBeenCalled();
    expect(panel.toolbar.hide).toHaveBeenCalled();
    expect(panel.content.node.classList.contains(DOCUMENT_MODE_CSS_CLASS)).toBe(true);
  });

  it('resets back to notebook mode on tab switch', () => {
    const firstPanel = createMockNotebookPanel('first');
    const deps = createMockDependencies(firstPanel);
    const manager = new NotebookViewModeManager(
      deps.mockNotebookTracker,
      deps.mockStreamlitPreviewManager
    );

    manager.setMode('Document');
    expect(manager.getMode()).toBe('Document');

    const secondPanel = createMockNotebookPanel('second');
    (deps.mockNotebookTracker as any).currentWidget = secondPanel;
    deps.triggerCurrentChanged();

    expect(manager.getMode()).toBe('Notebook');
    expect(secondPanel.toolbar.hide).toHaveBeenCalled();
    expect(secondPanel.content.show).toHaveBeenCalled();
  });
});
