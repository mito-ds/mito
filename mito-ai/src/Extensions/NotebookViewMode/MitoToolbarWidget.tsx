/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { JupyterFrontEnd } from '@jupyterlab/application';
import { IToolbarWidgetRegistry, ToolbarRegistry } from '@jupyterlab/apputils';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { Toolbar } from '@jupyterlab/ui-components';
import { Widget, Panel, PanelLayout } from '@lumino/widgets';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { IAppDeployService } from '../AppDeploy/AppDeployPlugin';
import { IAppManagerService } from '../AppManager/ManageAppsPlugin';
import { INotebookViewMode, NotebookViewMode } from './NotebookViewModePlugin';
import { AppActionsWidget } from './toolbar/AppActionsWidget';
import { CurrentWidgetCloseButton } from './toolbar/CurrentWidgetCloseButton';
import { ModeSwitcherWidget } from './toolbar/ModeSwitcherWidget';
import { NotebookHeroWidget } from './toolbar/NotebookHeroWidget';
import { TabDropdownWidget } from './toolbar/TabDropdownWidget';

import '../../../style/MitoTopToolbar.css';
import '../../../style/RunCellButton.css';
import '../../../style/button.css';

export class MitoToolbarWidget extends Widget {
  private static readonly _TOOLBAR_POPUP_OPENER_ITEM_NAME = 'toolbar-popup-opener';

  private static readonly _DEFAULT_NOTEBOOK_ITEM_NAMES = new Set([
    'save',
    'insert',
    'cut',
    'copy',
    'paste',
    'run',
    'run-all',
    'restart',
    'interrupt',
    'restart-and-run',
    'cellType',
    'kernelName',
    'executionProgress',
    'debugger-icon'
  ]);

  private readonly _leftCluster: TabDropdownWidget;
  private readonly _centerWidget: ModeSwitcherWidget;
  private readonly _rightCluster = new Panel();
  private readonly _notebookJupyterControls = new Toolbar();
  private readonly _notebookExtensions = new Toolbar();
  private readonly _rightDivider = new Widget();
  private readonly _notebookHero = new NotebookHeroWidget();
  private readonly _appActions: AppActionsWidget;
  private readonly _currentWidgetCloseButton: CurrentWidgetCloseButton;
  private _transferredNotebookItems: Array<{ name: string; widget: Widget }> = [];
  private _sourcePanelForTransferredItems: NotebookPanel | null = null;

  constructor(
    viewMode: INotebookViewMode,
    getActivePanel: () => NotebookPanel | null,
    notebookTracker: INotebookTracker,
    app: JupyterFrontEnd,
    private readonly toolbarRegistry: IToolbarWidgetRegistry,
    getCurrentWidget: () => Widget | null,
    documentManager: IDocumentManager,
    appDeployService: IAppDeployService,
    appManagerService: IAppManagerService
  ) {
    super();
    this.id = 'mito-top-toolbar';
    this.addClass('mito-top-toolbar');
    this.node.setAttribute('role', 'toolbar');

    this._leftCluster = new TabDropdownWidget(
      app,
      notebookTracker,
      viewMode,
      getActivePanel,
      getCurrentWidget
    );

    this._centerWidget = new ModeSwitcherWidget(viewMode, getActivePanel);

    this._rightCluster.addClass('mito-top-toolbar-right');
    this._notebookJupyterControls.addClass('mito-top-toolbar-jupyter-controls');
    this._notebookExtensions.addClass('mito-top-toolbar-notebook-extensions');
    this._rightDivider.addClass('mito-top-toolbar-right-divider');
    this._appActions = new AppActionsWidget(
      app,
      documentManager,
      appDeployService,
      appManagerService,
      viewMode
    );
    this._currentWidgetCloseButton = new CurrentWidgetCloseButton(app, getCurrentWidget);
    this._rightCluster.addWidget(this._notebookJupyterControls);
    this._rightCluster.addWidget(this._notebookExtensions);
    this._rightCluster.addWidget(this._rightDivider);
    this._rightCluster.addWidget(this._notebookHero);
    this._rightCluster.addWidget(this._appActions);

    const layout = new PanelLayout();
    this.layout = layout;
    layout.addWidget(this._currentWidgetCloseButton);
    layout.addWidget(this._leftCluster);
    layout.addWidget(this._centerWidget);
    layout.addWidget(this._rightCluster);

    this.setMode(viewMode.getMode());
  }

  get notebookExtensionsToolbar(): Toolbar {
    return this._notebookExtensions;
  }

  prepareNotebookExtensionToolbarForRebind(): void {
    if (!this._sourcePanelForTransferredItems) {
      this._transferredNotebookItems = [];
      return;
    }

    const sourceToolbar = this._sourcePanelForTransferredItems.toolbar as unknown as {
      addItem?: (name: string, widget: Widget) => void;
    };
    if (!sourceToolbar.addItem) {
      this._sourcePanelForTransferredItems = null;
      this._transferredNotebookItems = [];
      return;
    }

    this._transferredNotebookItems.forEach(({ name, widget }) => {
      sourceToolbar.addItem?.(name, widget);
    });
    this._sourcePanelForTransferredItems = null;
    this._transferredNotebookItems = [];
  }

  syncNotebookExtensionToolbar(panel: NotebookPanel | null): void {
    if (!panel) {
      return;
    }

    const sourceToolbar = panel.toolbar as unknown as {
      names?: () => Iterable<string>;
      removeItem?: (name: string) => Widget | undefined;
      children?: () => Iterable<Widget>;
      node?: HTMLElement;
    };
    this._hideToolbarPopupOpener({
      children: () => this._notebookExtensions.children(),
      node: this._notebookExtensions.node
    });
    const transferableItems = this._getTransferableNotebookItems(sourceToolbar);
    if (transferableItems.length === 0) {
      return;
    }

    this._sourcePanelForTransferredItems = panel;
    this._transferredNotebookItems = [];

    transferableItems.forEach(({ name, widget }) => {
      this._notebookExtensions.addItem(this._getTransferredItemName(name), widget);
      this._transferredNotebookItems.push({ name, widget });
    });
  }

  toggleTabDropdown(): void {
    this._leftCluster.toggleDropdown();
  }

  setMode(mode: NotebookViewMode): void {
    if (mode === 'App') {
      this._notebookJupyterControls.hide();
      this._notebookExtensions.hide();
      this._notebookHero.hide();
      this._rightDivider.show();
      this._appActions.show();
    } else if (mode === 'Notebook') {
      this._notebookJupyterControls.show();
      this._notebookExtensions.show();
      this._rightDivider.show();
      this._notebookHero.show();
      this._appActions.hide();
    } else {
      this._notebookJupyterControls.hide();
      this._notebookExtensions.hide();
      this._rightDivider.hide();
      this._notebookHero.hide();
      this._appActions.hide();
    }
  }

  setActivePanel(panel: NotebookPanel | null): void {
    this._leftCluster.setActivePanel(panel);
    this._centerWidget.update();
    this._setNotebookJupyterControls(panel);
    this._notebookHero.setPanel(panel);
    this._appActions.setPanel(panel);
    this._currentWidgetCloseButton.update();
  }

  refreshCurrentWidgetState(panel: NotebookPanel | null): void {
    this._leftCluster.setActivePanel(panel);
    this._centerWidget.update();
    this._currentWidgetCloseButton.update();
  }

  private _setNotebookJupyterControls(panel: NotebookPanel | null): void {
    Array.from(this._notebookJupyterControls.children()).forEach((child) => {
      child.dispose();
    });

    if (!panel) {
      return;
    }

    const toolbarItems: ToolbarRegistry.IWidget[] = [
      {
        name: 'insert',
        command: 'notebook:insert-cell-below',
        icon: 'ui-components:add'
      },
      { name: 'cellType' }
    ];

    toolbarItems.forEach((item) => {
      this._notebookJupyterControls.addItem(
        item.name,
        this.toolbarRegistry.createWidget('Notebook', panel, item)
      );
    });
  }

  private _getTransferredItemName(itemName: string): string {
    return `third-party:${itemName}`;
  }

  private _getTransferableNotebookItems(sourceToolbar: {
    names?: () => Iterable<string>;
    removeItem?: (name: string) => Widget | undefined;
    children?: () => Iterable<Widget>;
    node?: HTMLElement;
  }): Array<{ name: string; widget: Widget }> {
    const transferableItems: Array<{ name: string; widget: Widget }> = [];
    this._hideToolbarPopupOpener(sourceToolbar);

    if (sourceToolbar.names && sourceToolbar.removeItem) {
      Array.from(sourceToolbar.names()).forEach(itemName => {
        if (
          MitoToolbarWidget._DEFAULT_NOTEBOOK_ITEM_NAMES.has(itemName) ||
          itemName === MitoToolbarWidget._TOOLBAR_POPUP_OPENER_ITEM_NAME
        ) {
          return;
        }
        const widget = sourceToolbar.removeItem?.(itemName);
        if (!widget) {
          return;
        }
        transferableItems.push({ name: itemName, widget });
      });
      return transferableItems;
    }

    if (!sourceToolbar.children || !sourceToolbar.node) {
      return transferableItems;
    }

    const names = Array.from(
      sourceToolbar.node.querySelectorAll<HTMLElement>('[data-jp-item-name]')
    )
      .map(node => node.getAttribute('data-jp-item-name'))
      .filter((name): name is string => Boolean(name));
    const widgets = Array.from(sourceToolbar.children());
    const pairCount = Math.min(names.length, widgets.length);
    for (let index = 0; index < pairCount; index += 1) {
      const name = names[index];
      const widget = widgets[index];
      if (!name || !widget) {
        continue;
      }
      if (MitoToolbarWidget._DEFAULT_NOTEBOOK_ITEM_NAMES.has(name)) {
        continue;
      }
      if (name === MitoToolbarWidget._TOOLBAR_POPUP_OPENER_ITEM_NAME) {
        widget.hide();
        continue;
      }
      transferableItems.push({ name, widget });
    }
    return transferableItems;
  }

  private _hideToolbarPopupOpener(sourceToolbar: {
    names?: () => Iterable<string>;
    children?: () => Iterable<Widget>;
    node?: HTMLElement;
  }): void {
    if (sourceToolbar.names && sourceToolbar.children) {
      const names = Array.from(sourceToolbar.names());
      const widgets = Array.from(sourceToolbar.children());
      const popupOpenerIndex = names.indexOf(
        MitoToolbarWidget._TOOLBAR_POPUP_OPENER_ITEM_NAME
      );
      if (popupOpenerIndex >= 0) {
        widgets[popupOpenerIndex]?.hide();
      }
    }

    const popupOpenerSelector = [
      `[data-jp-item-name="${MitoToolbarWidget._TOOLBAR_POPUP_OPENER_ITEM_NAME}"]`,
      `.${MitoToolbarWidget._TOOLBAR_POPUP_OPENER_ITEM_NAME}`
    ].join(', ');
    sourceToolbar.node
      ?.querySelectorAll<HTMLElement>(popupOpenerSelector)
      .forEach(node => {
        node.style.display = 'none';
      });
  }
}
