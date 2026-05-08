/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import fs from 'fs';
import path from 'path';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { IToolbarWidgetRegistry } from '@jupyterlab/apputils';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { Widget } from '@lumino/widgets';
import { MitoToolbarWidget } from '../../Extensions/NotebookViewMode/MitoToolbarWidget';
import { INotebookViewMode } from '../../Extensions/NotebookViewMode/NotebookViewModePlugin';

const createMockSignal = (): { connect: jest.Mock } => ({
  connect: jest.fn()
});

const createMockNotebookPanel = (
  id: string,
  path: string,
  dirty = false
): NotebookPanel =>
  (({
    id,
    title: {
      label: path
    },
    context: {
      path,
      model: {
        dirty,
        stateChanged: createMockSignal()
      },
      pathChanged: createMockSignal(),
      saveState: createMockSignal()
    },
    disposed: createMockSignal(),
    close: jest.fn()
  } as unknown as NotebookPanel) as any);

const createMockNotebookTracker = (
  panels: NotebookPanel[]
): INotebookTracker =>
  ({
    forEach: (callback: (panel: NotebookPanel) => void) => {
      panels.forEach(callback);
    },
    widgetAdded: createMockSignal(),
    currentChanged: createMockSignal()
  }) as unknown as INotebookTracker;

const createdToolbarWidgets: MitoToolbarWidget[] = [];

const createMockToolbarWidget = (
  panels: NotebookPanel[],
  activePanel: NotebookPanel | null,
  currentWidget: Widget | null = activePanel
): MitoToolbarWidget => {
  const app = {
    shell: {
      activateById: jest.fn()
    },
    commands: {
      hasCommand: jest.fn(() => false),
      execute: jest.fn()
    }
  } as unknown as JupyterFrontEnd;
  const viewMode = {
    getMode: jest.fn(() => 'Notebook'),
    setMode: jest.fn(),
    syncToCurrentNotebook: jest.fn(),
    openPreviewAndSwitchToAppMode: jest.fn(),
    modeChanged: createMockSignal()
  } as unknown as INotebookViewMode;
  const toolbarRegistry = {
    createWidget: jest.fn(() => new Widget())
  } as unknown as IToolbarWidgetRegistry;

  const toolbarWidget = new MitoToolbarWidget(
    viewMode,
    () => activePanel,
    createMockNotebookTracker(panels),
    app,
    toolbarRegistry,
    () => currentWidget,
    {} as IDocumentManager,
    {} as any,
    {} as any
  );
  createdToolbarWidgets.push(toolbarWidget);
  return toolbarWidget;
};

describe('MitoToolbarWidget', () => {
  afterEach(() => {
    createdToolbarWidgets.splice(0).forEach(widget => widget.dispose());
    document.body.innerHTML = '';
  });

  it('renders dirty indicators and close buttons in the same action slot', async () => {
    const dirtyPanel = createMockNotebookPanel('dirty', 'dirty.ipynb', true);
    const cleanPanel = createMockNotebookPanel('clean', 'clean.ipynb');
    const widget = createMockToolbarWidget(
      [dirtyPanel, cleanPanel],
      dirtyPanel
    );

    Widget.attach(widget, document.body);
    widget.toggleTabDropdown();
    await new Promise(resolve => setTimeout(resolve, 0));

    const dirtyRow = document.querySelector(
      '.mito-tab-dropdown-row[title="dirty.ipynb"]'
    );
    const cleanRow = document.querySelector(
      '.mito-tab-dropdown-row[title="clean.ipynb"]'
    );

    expect(
      dirtyRow?.querySelector(
        '.mito-tab-dropdown-row-action .mito-tab-dropdown-dirty-dot'
      )
    ).not.toBeNull();
    expect(
      cleanRow?.querySelector(
        '.mito-tab-dropdown-row-action.mito-tab-dropdown-close'
      )
    ).not.toBeNull();
  });

  it('keeps notebook rows in a scroll area separate from the footer', async () => {
    const panels = Array.from({ length: 20 }, (_, index) =>
      createMockNotebookPanel(
        `panel-${index}`,
        `Untitled${index}.ipynb`
      )
    );
    const widget = createMockToolbarWidget(panels, panels[0] ?? null);

    Widget.attach(widget, document.body);
    widget.toggleTabDropdown();
    await new Promise(resolve => setTimeout(resolve, 0));

    const scrollArea = document.querySelector(
      '.mito-tab-dropdown-scroll-area'
    );
    const footer = document.querySelector('.mito-tab-dropdown-footer');

    expect(scrollArea?.querySelectorAll('.mito-tab-dropdown-row')).toHaveLength(
      20
    );
    expect(scrollArea?.contains(footer)).toBe(false);
  });

  it('caps the notebook list height with vertical scrolling', () => {
    const css = fs.readFileSync(
      path.resolve(__dirname, '../../../style/MitoTopToolbar.css'),
      'utf-8'
    );

    expect(css).toContain('.mito-tab-dropdown-scroll-area');
    expect(css).toContain('max-height: 552px;');
    expect(css).toContain('overflow-y: auto;');
  });

  it('matches the rounded toolbar switcher treatment', () => {
    const css = fs.readFileSync(
      path.resolve(__dirname, '../../../style/MitoTopToolbar.css'),
      'utf-8'
    );

    expect(css).toContain('.mito-tab-dropdown-trigger');
    expect(css).toContain('padding: 2px;');
    expect(css).toContain('border: none;');
    expect(css).toContain('border-radius: 8px;');
    expect(css).toContain('background: transparent;');
    expect(css).toContain('.mito-tab-dropdown-trigger-content');
    expect(css).toContain('border-radius: 7px;');
    expect(css).toContain('box-shadow 0.15s ease;');
  });

  it('shows the launcher name when no notebook is active', async () => {
    const launcher = new Widget();
    launcher.id = 'launcher';
    launcher.title.label = 'Launcher';
    const widget = createMockToolbarWidget([], null, launcher);

    Widget.attach(widget, document.body);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(document.querySelector('.mito-tab-dropdown-filename')?.textContent).toBe(
      'Launcher'
    );
  });

  it('uses the selected launcher tab name when Jupyter has no current widget yet', async () => {
    const selectedLauncherTab = document.createElement('div');
    selectedLauncherTab.setAttribute('role', 'tab');
    selectedLauncherTab.setAttribute('aria-selected', 'true');
    selectedLauncherTab.textContent = 'Launcher';
    document.body.appendChild(selectedLauncherTab);
    const widget = createMockToolbarWidget([], null, null);

    Widget.attach(widget, document.body);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(document.querySelector('.mito-tab-dropdown-filename')?.textContent).toBe(
      'Launcher'
    );
  });

  it('closes the current closable main area widget', async () => {
    const settings = new Widget();
    settings.title.label = 'Mito AI Settings';
    settings.title.closable = true;
    const closeSpy = jest.spyOn(settings, 'close');
    const widget = createMockToolbarWidget([], null, settings);

    Widget.attach(widget, document.body);
    await new Promise(resolve => setTimeout(resolve, 0));
    document.querySelector<HTMLButtonElement>('.mito-top-toolbar-close-button')?.click();

    expect(closeSpy).toHaveBeenCalled();
  });

  it('hides the global close button for non-closable widgets', async () => {
    const widget = createMockToolbarWidget([], null, new Widget());

    Widget.attach(widget, document.body);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(document.querySelector('.mito-top-toolbar-close-button')).toBeNull();
  });

  it('transfers third-party notebook toolbar widgets and restores them on rebind', () => {
    const kernelSpyWidget = new Widget();
    const popupOpenerWidget = new Widget();
    const toolbarItems = new Map<string, Widget>([
      ['save', new Widget()],
      ['insert', new Widget()],
      ['executionProgress', new Widget()],
      ['toolbar-popup-opener', popupOpenerWidget],
      ['kernelspy-new', kernelSpyWidget]
    ]);
    const panel = createMockNotebookPanel('kernelspy-panel', 'kernelspy.ipynb');
    const mockToolbar = {
      names: jest.fn(() => toolbarItems.keys()),
      children: jest.fn(() => toolbarItems.values()),
      removeItem: jest.fn((name: string) => {
        const item = toolbarItems.get(name);
        if (item) {
          toolbarItems.delete(name);
        }
        return item;
      }),
      addItem: jest.fn((name: string, widget: Widget) => {
        toolbarItems.set(name, widget);
      })
    };
    (panel as any).toolbar = mockToolbar;

    const widget = createMockToolbarWidget([panel], panel);
    const addItemSpy = jest.spyOn(widget.notebookExtensionsToolbar, 'addItem');

    widget.syncNotebookExtensionToolbar(panel);

    expect(mockToolbar.removeItem).toHaveBeenCalledWith('kernelspy-new');
    expect(mockToolbar.removeItem).not.toHaveBeenCalledWith('save');
    expect(mockToolbar.removeItem).not.toHaveBeenCalledWith('insert');
    expect(mockToolbar.removeItem).not.toHaveBeenCalledWith('executionProgress');
    expect(mockToolbar.removeItem).not.toHaveBeenCalledWith('toolbar-popup-opener');
    expect(popupOpenerWidget.isHidden).toBe(true);
    expect(addItemSpy).toHaveBeenCalledWith('third-party:kernelspy-new', kernelSpyWidget);
    expect(addItemSpy).not.toHaveBeenCalledWith('third-party:save', expect.anything());
    expect(addItemSpy).not.toHaveBeenCalledWith(
      'third-party:executionProgress',
      expect.anything()
    );

    widget.prepareNotebookExtensionToolbarForRebind();

    expect(mockToolbar.addItem).toHaveBeenCalledWith('kernelspy-new', kernelSpyWidget);
  });
});
