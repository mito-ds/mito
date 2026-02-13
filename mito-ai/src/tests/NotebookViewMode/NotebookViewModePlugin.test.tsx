/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { JupyterFrontEnd } from '@jupyterlab/application';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { NotebookViewModeManager, DOCUMENT_MODE_CSS_CLASS } from '../../Extensions/NotebookViewMode/NotebookViewModePlugin';
import { IStreamlitPreviewManager } from '../../Extensions/AppPreview/StreamlitPreviewPlugin';
import { IAppDeployService } from '../../Extensions/AppDeploy/AppDeployPlugin';
import { IAppManagerService } from '../../Extensions/AppManager/ManageAppsPlugin';
import { MODE_TOOLBAR_CLASS } from '../../Extensions/NotebookViewMode/ModeToolbarWidget';

// Mock CSS imports that the module pulls in
jest.mock('../../../../style/DocumentMode.css', () => ({}));
jest.mock('../../../../style/NotebookToolbar.css', () => ({}));
jest.mock('../../../../style/ModeToolbar.css', () => ({}));
jest.mock('../../../../style/button.css', () => ({}));
jest.mock('../../../../style/NotebookViewModeSwitcher.css', () => ({}));

// Mock dependencies that are not under test
jest.mock('../../utils/notebook', () => ({
    setActiveCellByIDInNotebookPanel: jest.fn(),
    scrollToCell: jest.fn(),
}));
jest.mock('../../utils/notebookMetadata', () => ({
    getNotebookIDAndSetIfNonexistant: jest.fn().mockReturnValue('mock-notebook-id'),
}));
jest.mock('../../restAPI/RestAPI', () => ({
    logEvent: jest.fn(),
}));
jest.mock('../../Extensions/AppPreview/PlaceholderWidget', () => ({
    PlaceholderWidget: jest.fn().mockImplementation(() => ({
        dispose: jest.fn(),
        isDisposed: false,
    })),
}));

/**
 * Helper to create a mock NotebookPanel with spied toolbar, content, and contentHeader.
 */
function createMockNotebookPanel(id: string): NotebookPanel {
    const modeToolbarNode = document.createElement('div');
    modeToolbarNode.classList.add(MODE_TOOLBAR_CLASS);

    // Mock mode toolbar widget
    const mockModeToolbarWidget = {
        hasClass: jest.fn((cls: string) => cls === MODE_TOOLBAR_CLASS),
        show: jest.fn(),
        hide: jest.fn(),
        setMode: jest.fn(),
        update: jest.fn(),
    };

    const panel = {
        id,
        toolbar: {
            show: jest.fn(),
            hide: jest.fn(),
            addClass: jest.fn(),
            insertItem: jest.fn().mockReturnValue(true),
            node: {
                querySelector: jest.fn().mockReturnValue(null),
            },
        },
        content: {
            show: jest.fn(),
            hide: jest.fn(),
            node: document.createElement('div'),
            widgets: [],
        },
        contentHeader: {
            node: {
                querySelector: jest.fn().mockReturnValue(null),
            },
            addWidget: jest.fn(),
            widgets: [mockModeToolbarWidget],
        },
        context: {
            path: '/test/notebook.ipynb',
            save: jest.fn().mockResolvedValue(undefined),
            sessionContext: {
                statusChanged: { connect: jest.fn() },
            },
        },
        layout: {
            addWidget: jest.fn(),
        },
        disposed: {
            connect: jest.fn(),
        },
        // Expose the mock mode toolbar widget for assertions
        _mockModeToolbarWidget: mockModeToolbarWidget,
    } as unknown as NotebookPanel & { _mockModeToolbarWidget: typeof mockModeToolbarWidget };

    return panel;
}

/**
 * Helper to create mock services and tracker.
 */
function createMockDependencies(panel: NotebookPanel) {
    const mockApp = {
        commands: {
            hasCommand: jest.fn().mockReturnValue(false),
        },
    } as unknown as JupyterFrontEnd;

    const mockNotebookTracker = {
        currentWidget: panel,
        currentChanged: {
            connect: jest.fn(),
        },
        forEach: jest.fn(),
        widgetAdded: {
            connect: jest.fn(),
        },
    } as unknown as INotebookTracker;

    const mockStreamlitPreviewManager = {
        startPreview: jest.fn(),
        stopPreview: jest.fn(),
        editPreview: jest.fn(),
    } as unknown as IStreamlitPreviewManager;

    const mockAppDeployService = {} as IAppDeployService;
    const mockAppManagerService = {} as IAppManagerService;

    return {
        mockApp,
        mockNotebookTracker,
        mockStreamlitPreviewManager,
        mockAppDeployService,
        mockAppManagerService,
    };
}

describe('NotebookViewModeManager', () => {
    let manager: NotebookViewModeManager;
    let panel: NotebookPanel & { _mockModeToolbarWidget: any };
    let deps: ReturnType<typeof createMockDependencies>;

    beforeEach(() => {
        panel = createMockNotebookPanel('test-panel-1') as NotebookPanel & { _mockModeToolbarWidget: any };
        deps = createMockDependencies(panel);

        manager = new NotebookViewModeManager(
            deps.mockApp,
            deps.mockNotebookTracker,
            deps.mockStreamlitPreviewManager,
            deps.mockAppDeployService,
            deps.mockAppManagerService,
        );

        // Set up the panel (adds mode switcher + mode toolbar)
        manager.setupNotebookPanel(panel);

        // Clear call counts from setup so tests only see calls from mode switches
        jest.clearAllMocks();
        // Re-assign currentWidget since clearAllMocks may affect getter
        (deps.mockNotebookTracker as any).currentWidget = panel;
    });

    describe('Notebook mode', () => {
        it('shows native toolbar', () => {
            // First switch to Document so we can switch back to Notebook
            manager.setMode('Document');
            jest.clearAllMocks();
            (deps.mockNotebookTracker as any).currentWidget = panel;

            manager.setMode('Notebook');

            expect(panel.toolbar.show).toHaveBeenCalled();
        });

        it('hides custom mode toolbar', () => {
            manager.setMode('Document');
            jest.clearAllMocks();
            (deps.mockNotebookTracker as any).currentWidget = panel;

            manager.setMode('Notebook');

            expect(panel._mockModeToolbarWidget.hide).toHaveBeenCalled();
        });

        it('shows notebook content', () => {
            manager.setMode('Document');
            jest.clearAllMocks();
            (deps.mockNotebookTracker as any).currentWidget = panel;

            manager.setMode('Notebook');

            expect(panel.content.show).toHaveBeenCalled();
        });

        it('removes document-mode CSS class', () => {
            manager.setMode('Document');
            jest.clearAllMocks();
            (deps.mockNotebookTracker as any).currentWidget = panel;

            manager.setMode('Notebook');

            expect(panel.content.node.classList.contains(DOCUMENT_MODE_CSS_CLASS)).toBe(false);
        });
    });

    describe('Document mode', () => {
        it('hides native toolbar', () => {
            manager.setMode('Document');

            expect(panel.toolbar.hide).toHaveBeenCalled();
        });

        it('shows custom mode toolbar', () => {
            manager.setMode('Document');

            expect(panel._mockModeToolbarWidget.show).toHaveBeenCalled();
        });

        it('shows notebook content', () => {
            manager.setMode('Document');

            expect(panel.content.show).toHaveBeenCalled();
        });

        it('adds document-mode CSS class', () => {
            manager.setMode('Document');

            expect(panel.content.node.classList.contains(DOCUMENT_MODE_CSS_CLASS)).toBe(true);
        });
    });

    describe('App mode (via _applyAppModeUI)', () => {
        it('hides native toolbar', async () => {
            // Use openPreviewAndSwitchToAppMode to trigger _applyAppModeUI
            deps.mockStreamlitPreviewManager.startPreview = jest.fn().mockResolvedValue({
                type: 'error',
                error: 'test error',
            });

            await manager.openPreviewAndSwitchToAppMode(panel);

            // _applyAppModeUI is called first (hides toolbar), then on error it reverts.
            // Check that hide was called at least once.
            expect(panel.toolbar.hide).toHaveBeenCalled();
        });

        it('shows custom mode toolbar', async () => {
            deps.mockStreamlitPreviewManager.startPreview = jest.fn().mockResolvedValue({
                type: 'error',
                error: 'test error',
            });

            await manager.openPreviewAndSwitchToAppMode(panel);

            expect(panel._mockModeToolbarWidget.show).toHaveBeenCalled();
        });

        it('hides notebook content', async () => {
            deps.mockStreamlitPreviewManager.startPreview = jest.fn().mockResolvedValue({
                type: 'error',
                error: 'test error',
            });

            await manager.openPreviewAndSwitchToAppMode(panel);

            expect(panel.content.hide).toHaveBeenCalled();
        });
    });

    describe('Mode switching', () => {
        it('defaults to Notebook mode', () => {
            expect(manager.getMode()).toBe('Notebook');
        });

        it('emits modeChanged signal when mode changes', () => {
            const spy = jest.fn();
            manager.modeChanged.connect(spy);

            manager.setMode('Document');

            expect(spy).toHaveBeenCalledWith(manager, 'Document');
        });

        it('does not re-apply if mode is unchanged', () => {
            // Default mode is Notebook. Calling setMode('Notebook') should be a no-op.
            manager.setMode('Notebook');

            expect(panel.toolbar.show).not.toHaveBeenCalled();
            expect(panel.toolbar.hide).not.toHaveBeenCalled();
        });

        it('transitions from Document to Notebook correctly', () => {
            manager.setMode('Document');
            jest.clearAllMocks();
            (deps.mockNotebookTracker as any).currentWidget = panel;

            manager.setMode('Notebook');

            // Native toolbar shown, custom toolbar hidden
            expect(panel.toolbar.show).toHaveBeenCalled();
            expect(panel._mockModeToolbarWidget.hide).toHaveBeenCalled();
            // Content visible, document CSS removed
            expect(panel.content.show).toHaveBeenCalled();
            expect(panel.content.node.classList.contains(DOCUMENT_MODE_CSS_CLASS)).toBe(false);
        });

        it('transitions from Notebook to Document correctly', () => {
            manager.setMode('Document');

            // Native toolbar hidden, custom toolbar shown
            expect(panel.toolbar.hide).toHaveBeenCalled();
            expect(panel._mockModeToolbarWidget.show).toHaveBeenCalled();
            // Content visible, document CSS added
            expect(panel.content.show).toHaveBeenCalled();
            expect(panel.content.node.classList.contains(DOCUMENT_MODE_CSS_CLASS)).toBe(true);
        });
    });
});
