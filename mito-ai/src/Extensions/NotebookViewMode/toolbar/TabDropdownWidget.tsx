/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { PathExt } from '@jupyterlab/coreutils';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { ReactWidget } from '@jupyterlab/ui-components';
import { Message } from '@lumino/messaging';
import { Widget } from '@lumino/widgets';
import ChevronIcon from '../../../icons/ChevronIcon';
import FileIcon from '../../../icons/FileIcon';
import { INotebookViewMode } from '../NotebookViewModePlugin';
import {
  getCurrentWidgetDisplayName,
  getDisplayName,
  getRelativeTimestamp,
  getShortcutLabel,
  isToday,
  LAUNCHER_COMMAND,
  middleTruncateFilename
} from '../mitoToolbarWidgetUtils';

interface ITabDropdownContentProps {
  notebooks: NotebookPanel[];
  activePanel: NotebookPanel | null;
  activeFilename: string;
  isOpen: boolean;
  activeOptionIndex: number;
  onToggleOpen: () => void;
  onTriggerKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
  onMenuKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onActivateNotebook: (panel: NotebookPanel) => void;
  onCloseNotebook: (panel: NotebookPanel) => void;
  onOpenLauncher: () => void;
  getPanelTimestamp: (panel: NotebookPanel) => number;
}

const TabDropdownContent: React.FC<ITabDropdownContentProps> = ({
  notebooks,
  activePanel,
  activeFilename,
  isOpen,
  activeOptionIndex,
  onToggleOpen,
  onTriggerKeyDown,
  onMenuKeyDown,
  onActivateNotebook,
  onCloseNotebook,
  onOpenLauncher,
  getPanelTimestamp
}) => {
  const triggerLabel =
    notebooks.length === 0 && activeFilename === 'No active notebook'
      ? 'No notebooks open'
      : middleTruncateFilename(activeFilename);
  const todayPanels = notebooks.filter(panel => isToday(getPanelTimestamp(panel)));
  const earlierPanels = notebooks.filter(panel => !isToday(getPanelTimestamp(panel)));

  const renderNotebookRow = (panel: NotebookPanel): JSX.Element => {
    const optionIndex = notebooks.indexOf(panel);
    const filename = getDisplayName(panel);
    const isActivePanel = panel === activePanel;
    const isActiveOption = optionIndex === activeOptionIndex;

    return (
      <div
        key={panel.id}
        role="menuitem"
        data-active-option={isActiveOption}
        tabIndex={isActiveOption ? 0 : -1}
        className={`mito-tab-dropdown-row${isActivePanel ? ' active' : ''}`}
        title={filename}
        onClick={() => onActivateNotebook(panel)}
      >
        <span className="mito-tab-dropdown-row-icon" aria-hidden>
          <FileIcon />
        </span>
        <span className="mito-tab-dropdown-row-filename">
          {middleTruncateFilename(filename)}
        </span>
        <span className="mito-tab-dropdown-row-time">
          {getRelativeTimestamp(getPanelTimestamp(panel))}
        </span>
        {panel.context.model.dirty ? (
          <span className="mito-tab-dropdown-row-action">
            <span className="mito-tab-dropdown-dirty-dot" title="Unsaved changes" />
          </span>
        ) : (
          <button
            type="button"
            tabIndex={-1}
            className="mito-tab-dropdown-row-action mito-tab-dropdown-close"
            aria-label={`Close ${filename}`}
            title={`Close ${filename}`}
            onClick={event => {
              event.stopPropagation();
              onCloseNotebook(panel);
            }}
          >
            x
          </button>
        )}
      </div>
    );
  };

  const renderFooter = (): JSX.Element => {
    const isActiveOption = notebooks.length === activeOptionIndex;
    return (
      <button
        type="button"
        role="menuitem"
        data-active-option={isActiveOption}
        tabIndex={isActiveOption ? 0 : -1}
        className="mito-tab-dropdown-footer"
        onClick={onOpenLauncher}
      >
        <span>+ New File</span>
        <span className="mito-tab-dropdown-footer-hint">Opens Launcher</span>
      </button>
    );
  };

  const renderMenu = (): JSX.Element => {
    return (
      <div className="mito-tab-dropdown-menu" role="menu">
        <div className="mito-tab-dropdown-scroll-area">
          {notebooks.length > 0 && (
            <div className="mito-tab-dropdown-menu-meta">
              <span className="mito-tab-dropdown-menu-meta-title">Open notebooks</span>
              <span className="mito-tab-dropdown-menu-meta-shortcut">{getShortcutLabel()}</span>
            </div>
          )}
          {notebooks.length === 0 ? (
            <div className="mito-tab-dropdown-empty">No notebooks open</div>
          ) : (
            <>
              {todayPanels.length > 0 && (
                <React.Fragment>
                  <div className="mito-tab-dropdown-group-label">Today</div>
                  {todayPanels.map(renderNotebookRow)}
                </React.Fragment>
              )}
              {earlierPanels.length > 0 && (
                <React.Fragment>
                  <div className="mito-tab-dropdown-group-label">Earlier</div>
                  {earlierPanels.map(renderNotebookRow)}
                </React.Fragment>
              )}
            </>
          )}
        </div>
        <div className="mito-tab-dropdown-divider" />
        {renderFooter()}
      </div>
    );
  };

  return (
    <div className="mito-tab-dropdown-root" onKeyDown={onMenuKeyDown}>
      <button
        type="button"
        className="mito-tab-dropdown-trigger"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title={`Switch notebooks (${getShortcutLabel()})`}
        onClick={onToggleOpen}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="mito-tab-dropdown-trigger-content">
          <span className="mito-tab-dropdown-filename">{triggerLabel}</span>
          {activePanel?.context.model.dirty && (
            <span className="mito-tab-dropdown-dirty-dot" title="Unsaved changes" />
          )}
          <span className="mito-tab-dropdown-caret" aria-hidden>
            <ChevronIcon direction={isOpen ? 'up' : 'down'} />
          </span>
        </span>
      </button>
      {isOpen && renderMenu()}
    </div>
  );
};

export class TabDropdownWidget extends ReactWidget {
  private readonly _lastOpenedByPanelId = new Map<string, number>();
  private readonly _trackedPanelIds = new Set<string>();
  private _activePanel: NotebookPanel | null = null;
  private _isOpen = false;
  private _activeOptionIndex = 0;

  constructor(
    private readonly app: JupyterFrontEnd,
    private readonly notebookTracker: INotebookTracker,
    private readonly viewMode: INotebookViewMode,
    private readonly getActivePanel: () => NotebookPanel | null,
    private readonly getCurrentWidget: () => Widget | null
  ) {
    super();
    this.addClass('mito-top-toolbar-left');

    this.notebookTracker.forEach(panel => {
      this._setupPanel(panel);
    });
    this.notebookTracker.widgetAdded.connect((_, panel) => {
      this._setupPanel(panel);
      this.update();
    });
    this.notebookTracker.currentChanged.connect((_, panel) => {
      this.setActivePanel(panel);
    });
  }

  onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    requestAnimationFrame(() => this.update());
    window.setTimeout(() => this.update(), 500);
  }

  setActivePanel(panel: NotebookPanel | null): void {
    this._activePanel = panel;
    if (panel) {
      this._recordOpened(panel);
    }
    this.update();
  }

  toggleDropdown(): void {
    this._setOpen(!this._isOpen, true);
  }

  render(): JSX.Element {
    const notebooks = this._getSortedNotebooks();
    const activePanel = this._getActivePanel();
    const activeFilename = activePanel
      ? getDisplayName(activePanel)
      : getCurrentWidgetDisplayName(this.getCurrentWidget());

    return (
      <TabDropdownContent
        notebooks={notebooks}
        activePanel={activePanel}
        activeFilename={activeFilename}
        isOpen={this._isOpen}
        activeOptionIndex={this._activeOptionIndex}
        onToggleOpen={() => this._setOpen(!this._isOpen, true)}
        onTriggerKeyDown={this._handleTriggerKeyDown}
        onMenuKeyDown={this._handleMenuKeyDown}
        onActivateNotebook={this._activateNotebook}
        onCloseNotebook={this._closeNotebook}
        onOpenLauncher={this._openLauncher}
        getPanelTimestamp={this._getPanelTimestamp}
      />
    );
  }

  private _setupPanel(panel: NotebookPanel): void {
    if (this._trackedPanelIds.has(panel.id)) {
      return;
    }

    this._trackedPanelIds.add(panel.id);
    this._recordOpened(panel);
    panel.context.pathChanged.connect(() => this.update());
    panel.context.model.stateChanged.connect(() => this.update());
    panel.context.saveState.connect(() => this.update());
    panel.disposed.connect(() => {
      this._trackedPanelIds.delete(panel.id);
      this._lastOpenedByPanelId.delete(panel.id);
      if (this._activePanel === panel) {
        this._activePanel = null;
      }
      this._activeOptionIndex = 0;
      this.update();
    });
  }

  private _getSortedNotebooks(): NotebookPanel[] {
    const notebooks: NotebookPanel[] = [];
    this.notebookTracker.forEach(panel => {
      notebooks.push(panel);
    });
    return notebooks.sort((a, b) => {
      return (
        (this._lastOpenedByPanelId.get(b.id) ?? 0) -
        (this._lastOpenedByPanelId.get(a.id) ?? 0)
      );
    });
  }

  private _recordOpened(panel: NotebookPanel): void {
    this._lastOpenedByPanelId.set(panel.id, Date.now());
  }

  private _getPanelTimestamp = (panel: NotebookPanel): number => {
    return this._lastOpenedByPanelId.get(panel.id) ?? Date.now();
  };

  private _getActivePanel(): NotebookPanel | null {
    return this.getActivePanel() ?? this._activePanel;
  }

  private _setOpen(open: boolean, shouldFocusOption = false): void {
    if (this._isOpen === open) {
      return;
    }

    this._isOpen = open;
    if (open) {
      this._activeOptionIndex = this._getInitialOptionIndex();
      document.addEventListener('mousedown', this._handleDocumentMouseDown);
      document.addEventListener('keydown', this._handleDocumentKeyDown);
    } else {
      document.removeEventListener('mousedown', this._handleDocumentMouseDown);
      document.removeEventListener('keydown', this._handleDocumentKeyDown);
    }
    this.update();

    if (open && shouldFocusOption) {
      this._focusActiveOption();
    }
  }

  private _focusActiveOption(): void {
    requestAnimationFrame(() => {
      this.node
        .querySelector<HTMLElement>('[data-active-option="true"]')
        ?.focus();
    });
  }

  private _getInitialOptionIndex(): number {
    const notebooks = this._getSortedNotebooks();
    const activePanel = this._getActivePanel();
    const activePanelIndex = activePanel ? notebooks.indexOf(activePanel) : -1;
    if (activePanelIndex >= 0) {
      return activePanelIndex;
    }
    return notebooks.length > 0 ? 0 : 0;
  }

  private _moveActiveOption(delta: number): void {
    const optionCount = this._getSortedNotebooks().length + 1;
    this._activeOptionIndex =
      (this._activeOptionIndex + delta + optionCount) % optionCount;
    this.update();
    this._focusActiveOption();
  }

  private _activateCurrentOption(): void {
    const notebooks = this._getSortedNotebooks();
    const panel = notebooks[this._activeOptionIndex];
    if (panel) {
      this._activateNotebook(panel);
      return;
    }
    this._openLauncher();
  }

  private _activateNotebook = (panel: NotebookPanel): void => {
    this._recordOpened(panel);
    this.app.shell.activateById(panel.id);
    this.viewMode.syncToCurrentNotebook();
    this._setOpen(false);
  };

  private _closeNotebook = (panel: NotebookPanel): void => {
    panel.close();
    this.update();
  };

  private _openLauncher = (): void => {
    const activePanel = this._getActivePanel();
    const cwd = activePanel ? PathExt.dirname(activePanel.context.path) : undefined;
    if (this.app.commands.hasCommand(LAUNCHER_COMMAND)) {
      void this.app.commands.execute(LAUNCHER_COMMAND, cwd ? { cwd } : undefined);
    }
    this._setOpen(false);
  };

  private _handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>): void => {
    if (event.key !== 'ArrowDown' && event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    this._setOpen(true, true);
  };

  private _handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (!this._isOpen) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this._moveActiveOption(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this._moveActiveOption(-1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this._activateCurrentOption();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this._setOpen(false);
    }
  };

  private _handleDocumentMouseDown = (event: MouseEvent): void => {
    if (!this.node.contains(event.target as Node)) {
      this._setOpen(false);
    }
  };

  private _handleDocumentKeyDown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented) {
      return;
    }

    if (!this._isOpen) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this._moveActiveOption(1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this._moveActiveOption(-1);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      this._activateCurrentOption();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this._setOpen(false);
    }
  };
}
