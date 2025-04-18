/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import type { Cell, ICellModel } from '@jupyterlab/cells';
import type { DocumentRegistry } from '@jupyterlab/docregistry';
import {
  NotebookPanel,
  type CellList,
  type Notebook
} from '@jupyterlab/notebook';
import type { IObservableList } from '@jupyterlab/observables';
import type { CommandRegistry } from '@lumino/commands';
import type { IDisposable } from '@lumino/disposable';
import { Signal } from '@lumino/signaling';
import type { PanelLayout, Widget } from '@lumino/widgets';
import { magicConfiguration } from './magicLineUtils';
import { createSQLCellToolbar } from './sqlcelltoolbar';
import type { ISqlSources } from './tokens';

/**
 * Cell tag for the mito SQL configuration cell.
 */
const MITO_SQL_CELL_CONFIGURATION_TAG = 'mito-sql-cell-configuration';

/**
 * Factory to handle SQL toolbar creation and disposal on a notebook panel.
 */
class SQLCellToolbarFactory implements IDisposable {
  private _configurationChecked = false;
  private _isDisposed = false;
  private _nSqlCells = 0;
  private _toolbars = new WeakMap<ICellModel, Widget>();

  /**
   * SQL toolbar factory.
   *
   * @param panel The notebook panel
   * @param sqlSources The SQL sources
   * @param commands Command registry
   */
  constructor(
    protected panel: NotebookPanel,
    protected sqlSources: ISqlSources,
    protected commands: CommandRegistry
  ) {
    this._onModelChanged(panel.content);
    panel.content.modelChanged.connect(this._onModelChanged, this);
    sqlSources.stateChanged.connect(this._onSQLSourcesChanged, this);
  }

  get isDisposed(): boolean {
    return this._isDisposed;
  }

  dispose(): void {
    if (this._isDisposed) {
      return;
    }

    this._isDisposed = true;
    this.panel.content.model?.cells.changed.disconnect(
      this._onCellsChanged,
      this
    );
    this.panel.content.modelChanged.disconnect(this._onModelChanged, this);
    Signal.clearData(this);
  }

  private _addToolbar(model: ICellModel): void {
    const cell = this._getCell(model);
    if (cell) {
      const toolbar = createSQLCellToolbar({
        commands: this.commands,
        model,
        onIsSQLChanged: this._onIsSqlCellChanged,
        sqlSources: this.sqlSources
      });
      (cell.layout as PanelLayout).insertWidget(0, toolbar);
      this._toolbars.set(model, toolbar);
      const removeToolbar = () => {
        this._toolbars.delete(model);
        toolbar.dispose();
      };
      cell.disposed.connect(removeToolbar);
    }
  }

  private _getCell(model: ICellModel): Cell | undefined {
    return this.panel?.content.widgets.find(widget => widget.model === model);
  }

  private _removeToolbar(model: ICellModel): void {
    this._toolbars.get(model)?.dispose();
    this._toolbars.delete(model);
  }

  private _onCellsChanged(
    cells: CellList,
    changed: IObservableList.IChangedArgs<ICellModel>
  ): void {
    changed.oldValues.forEach(model => this._removeToolbar(model));
    changed.newValues.forEach(model => this._addToolbar(model));
  }

  private _onIsSqlCellChanged = (isSQL: boolean): void => {
    if (isSQL) {
      this._nSqlCells++;
    } else {
      this._nSqlCells = Math.max(0, this._nSqlCells - 1);
    }

    if (this._nSqlCells === 1) {
      this._checkConfiguration();
    }
  };

  private _onModelChanged(content: Notebook): void {
    const cells = content.model?.cells;
    if (cells) {
      this._onCellsChanged(cells, {
        type: 'add',
        newIndex: 0,
        newValues: Array.from(cells),
        oldIndex: -1,
        oldValues: []
      });
    }
    cells?.changed.connect(this._onCellsChanged, this);
  }

  private _onSQLSourcesChanged(sources: ISqlSources, attribute: string): void {
    if (attribute === 'configurationFile' && sources.configurationFile) {
      this._checkConfiguration();
    }
  }

  /**
   * Check that the mandatory configuration cell is present.
   *
   * The configuration cell is marked using a cell tag `mito-sql-cell-configuration`.
   */
  private _checkConfiguration(): void {
    this.panel.context.ready.then(() => {
      if (
        !this.panel.content.model ||
        !this.sqlSources.configurationFile ||
        this.panel.content.model.readOnly ||
        this._configurationChecked
      ) {
        return;
      }

      this._configurationChecked = true;

      let found = false;
      const configuration = magicConfiguration(
        this.sqlSources.configurationFile
      );
      for (const cell of this.panel.content.model.cells ?? []) {
        if (cell.type === 'code') {
          const tags = (cell.getMetadata('tags') as string[] | undefined) ?? [];
          if (tags.includes(MITO_SQL_CELL_CONFIGURATION_TAG)) {
            if (cell.sharedModel.source !== configuration) {
              // Configuration cell exists but it is incorrect => update it.
              cell.sharedModel.source = configuration;
            }
            found = true;
          }
          if (found) {
            break;
          }
        }
      }

      if (!found) {
        // Missing configuration cell, insert it at the top.
        this.panel.content.model.sharedModel.insertCell(0, {
          cell_type: 'code',
          source: configuration,
          metadata: { tags: [MITO_SQL_CELL_CONFIGURATION_TAG] }
        });
      }
    });
  }
}

export class SQLExtension implements DocumentRegistry.WidgetExtension {
  /**
   * SQL toolbar extension for notebook panels.
   *
   * @param sqlSources The SQL sources
   * @param commands Command registry
   */
  constructor(
    protected sqlSources: ISqlSources,
    protected commands: CommandRegistry
  ) {}

  createNew(panel: NotebookPanel): SQLCellToolbarFactory {
    const toolbarFactory = new SQLCellToolbarFactory(
      panel,
      this.sqlSources,
      this.commands
    );
    return toolbarFactory;
  }
}
