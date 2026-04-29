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
  ({
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
  }) as unknown as NotebookPanel;

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

const createMockToolbarWidget = (
  panels: NotebookPanel[],
  activePanel: NotebookPanel | null
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

  return new MitoToolbarWidget(
    viewMode,
    () => activePanel,
    createMockNotebookTracker(panels),
    app,
    toolbarRegistry,
    {} as IDocumentManager,
    {} as any,
    {} as any
  );
};

describe('MitoToolbarWidget', () => {
  afterEach(() => {
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
});
