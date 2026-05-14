/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

jest.mock('../../../../style/DocumentMode.css', () => ({}));

jest.mock('../../utils/notebook', () => {
  const actual = jest.requireActual('../../utils/notebook') as Record<string, unknown>;
  return {
    ...actual,
    runAllCellsStrictlyBelow: jest.fn().mockResolvedValue(undefined)
  };
});

jest.mock('../../Extensions/NotebookViewMode/documentReactiveOrigin', () => {
  const actual = jest.requireActual(
    '../../Extensions/NotebookViewMode/documentReactiveOrigin'
  ) as Record<string, unknown>;
  return {
    ...actual,
    findCodeCellIndexForWidgetModelId: jest.fn().mockReturnValue(0)
  };
});

jest.mock('../../Extensions/Comments/CommentsPlugin', () => ({
  mountOutputCommentButtonOnHost: jest.fn(() => null)
}));

import type { JupyterFrontEnd } from '@jupyterlab/application';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import type { Kernel } from '@jupyterlab/services';
import { Signal } from '@lumino/signaling';
import { NotebookViewModeManager, DOCUMENT_MODE_CSS_CLASS } from '../../Extensions/NotebookViewMode/NotebookViewModePlugin';
import { IStreamlitPreviewManager } from '../../Extensions/AppPreview/StreamlitPreviewPlugin';
import * as documentReactiveOrigin from '../../Extensions/NotebookViewMode/documentReactiveOrigin';
import { runAllCellsStrictlyBelow } from '../../utils/notebook';

const findCodeCellIndexForWidgetModelIdMock =
  documentReactiveOrigin.findCodeCellIndexForWidgetModelId as jest.MockedFunction<
    typeof documentReactiveOrigin.findCodeCellIndexForWidgetModelId
  >;

class FakeKernel {
  readonly anyMessage = new Signal<FakeKernel, Kernel.IAnyMessageArgs>(this);
}

function makeTraitUpdateCommArgs(commId: string): Kernel.IAnyMessageArgs {
  return {
    direction: 'send',
    msg: {
      channel: 'shell',
      header: { msg_type: 'comm_msg' },
      content: {
        comm_id: commId,
        data: { method: 'update', state: { value: 1 } }
      }
    }
  } as unknown as Kernel.IAnyMessageArgs;
}

function getKernel(panel: NotebookPanel): FakeKernel {
  const k = (panel as unknown as { context: { sessionContext: { session: { kernel: unknown } } } })
    .context.sessionContext.session.kernel;
  return k as FakeKernel;
}

function createMockNotebookPanel(id: string): NotebookPanel {
  const kernel = new FakeKernel();
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
      save: jest.fn().mockResolvedValue(undefined),
      sessionContext: {
        session: { kernel },
        kernelChanged: {
          connect: jest.fn(),
          disconnect: jest.fn()
        }
      }
    },
    layout: {
      addWidget: jest.fn()
    },
    disposed: {
      connect: jest.fn(),
      disconnect: jest.fn()
    }
  } as unknown as NotebookPanel;

  return panel;
}

const mockJupyterApp = {
  commands: { execute: jest.fn() }
} as unknown as JupyterFrontEnd;

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
      deps.mockStreamlitPreviewManager,
      mockJupyterApp
    );

    manager.setupNotebookPanel(panel);

    expect(panel.toolbar.hide).toHaveBeenCalled();
  });

  it('switches to document mode and toggles document class', () => {
    const panel = createMockNotebookPanel('test-panel-1');
    const deps = createMockDependencies(panel);
    const manager = new NotebookViewModeManager(
      deps.mockNotebookTracker,
      deps.mockStreamlitPreviewManager,
      mockJupyterApp
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
      deps.mockStreamlitPreviewManager,
      mockJupyterApp
    );

    manager.setMode('Document');
    expect(manager.getMode()).toBe('Document');

    const secondPanel = createMockNotebookPanel('second');
    (deps.mockNotebookTracker as { currentWidget: NotebookPanel }).currentWidget = secondPanel;
    deps.triggerCurrentChanged();

    expect(manager.getMode()).toBe('Notebook');
    expect(secondPanel.toolbar.hide).toHaveBeenCalled();
    expect(secondPanel.content.show).toHaveBeenCalled();
  });
});

/**
 * Ties NotebookViewModeManager mode transitions to `runAllCellsStrictlyBelow` (mocked).
 * `ILabShell` focus (e.g. opening a `.py` file) is wired in `NotebookViewModePlugin.activate`,
 * not on `NotebookViewModeManager`, so that path is not exercised here.
 */
describe('NotebookViewModeManager document reactive lifecycle (runAllCellsStrictlyBelow)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (runAllCellsStrictlyBelow as jest.Mock).mockClear();
    findCodeCellIndexForWidgetModelIdMock.mockReturnValue(0);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not call runAllCellsStrictlyBelow while only in notebook mode', () => {
    const panel = createMockNotebookPanel('nb-1');
    const deps = createMockDependencies(panel);
    const manager = new NotebookViewModeManager(
      deps.mockNotebookTracker,
      deps.mockStreamlitPreviewManager,
      mockJupyterApp
    );
    expect(manager.getMode()).toBe('Notebook');

    getKernel(panel).anyMessage.emit(makeTraitUpdateCommArgs('w1'));
    jest.advanceTimersByTime(500);
    expect(runAllCellsStrictlyBelow).not.toHaveBeenCalled();
  });

  it('does not run cells after Document then Notebook when a trait comm was mid-debounce', () => {
    const panel = createMockNotebookPanel('nb-1');
    const deps = createMockDependencies(panel);
    const manager = new NotebookViewModeManager(
      deps.mockNotebookTracker,
      deps.mockStreamlitPreviewManager,
      mockJupyterApp
    );

    manager.setMode('Document');
    getKernel(panel).anyMessage.emit(makeTraitUpdateCommArgs('w1'));

    manager.setMode('Notebook');
    jest.advanceTimersByTime(500);

    expect(runAllCellsStrictlyBelow).not.toHaveBeenCalled();
  });

  it('does not run cells after Document then App when trait comm arrives after leaving Document', () => {
    const panel = createMockNotebookPanel('nb-1');
    const deps = createMockDependencies(panel);
    const manager = new NotebookViewModeManager(
      deps.mockNotebookTracker,
      deps.mockStreamlitPreviewManager,
      mockJupyterApp
    );

    manager.setMode('Document');
    manager.setMode('App');

    getKernel(panel).anyMessage.emit(makeTraitUpdateCommArgs('w1'));
    jest.advanceTimersByTime(500);

    expect(runAllCellsStrictlyBelow).not.toHaveBeenCalled();
  });

  it('does not run cells on the first notebook kernel after tab switch away from that document', () => {
    const firstPanel = createMockNotebookPanel('first');
    const deps = createMockDependencies(firstPanel);
    const manager = new NotebookViewModeManager(
      deps.mockNotebookTracker,
      deps.mockStreamlitPreviewManager,
      mockJupyterApp
    );

    manager.setMode('Document');

    const secondPanel = createMockNotebookPanel('second');
    (deps.mockNotebookTracker as { currentWidget: NotebookPanel }).currentWidget = secondPanel;
    deps.triggerCurrentChanged();

    getKernel(firstPanel).anyMessage.emit(makeTraitUpdateCommArgs('w1'));
    jest.advanceTimersByTime(500);

    expect(runAllCellsStrictlyBelow).not.toHaveBeenCalled();
  });

  it('does not run cells after syncToCurrentNotebook following Document mode', () => {
    const panel = createMockNotebookPanel('nb-1');
    const deps = createMockDependencies(panel);
    const manager = new NotebookViewModeManager(
      deps.mockNotebookTracker,
      deps.mockStreamlitPreviewManager,
      mockJupyterApp
    );

    manager.setMode('Document');
    getKernel(panel).anyMessage.emit(makeTraitUpdateCommArgs('w1'));

    manager.syncToCurrentNotebook();
    jest.advanceTimersByTime(500);

    expect(runAllCellsStrictlyBelow).not.toHaveBeenCalled();
  });

  it('does not run cells when findCodeCellIndexForWidgetModelId returns null (no widget origin)', () => {
    const panel = createMockNotebookPanel('nb-1');
    const deps = createMockDependencies(panel);
    const manager = new NotebookViewModeManager(
      deps.mockNotebookTracker,
      deps.mockStreamlitPreviewManager,
      mockJupyterApp
    );

    findCodeCellIndexForWidgetModelIdMock.mockReturnValue(null);
    manager.setMode('Document');
    getKernel(panel).anyMessage.emit(makeTraitUpdateCommArgs('w1'));
    jest.advanceTimersByTime(500);

    expect(runAllCellsStrictlyBelow).not.toHaveBeenCalled();
  });
});
