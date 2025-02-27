import { Option, Select, TextField, Toolbar } from '@jupyter/react-components';
import { CellChange } from '@jupyter/ydoc';
import { type ICellModel, type ICodeCellModel } from '@jupyterlab/cells';
import {
  VDomModel,
  VDomRenderer,
  addIcon,
  editIcon
} from '@jupyterlab/ui-components';
import { map } from '@lumino/algorithm';
import type { CommandRegistry } from '@lumino/commands';
import * as React from 'react';
import { CommandIDs } from './commands';
import { MagicLine } from './magicLineUtils';
import { type ISqlSources } from './tokens';

/**
 * The class of the toolbar.
 */
const TOOLBAR_CLASS = 'mito-sqlcell-toolbar';
const ADD_SOURCE_OPTION_VALUE = 'add-source';

/**
 * SQL toolbar model.
 */
export class SqlCellModel extends VDomModel {
  private _database = '';
  private _variableName = '';

  /**
   * The database name.
   */
  get database(): string {
    return this._database;
  }
  set database(v: string) {
    if (v !== this._database) {
      this._database = v;
      this.stateChanged.emit();
    }
  }

  /**
   * The SQL query result variable name.
   */
  get variableName(): string {
    return this._variableName;
  }
  set variableName(v: string) {
    if (v !== this._variableName) {
      this._variableName = v;
      this.stateChanged.emit();
    }
  }
}

/**
 * SQL toolbar constructor argument
 */
export interface ISQLCellToolbarOptions {
  /**
   * Command registry
   */
  commands: CommandRegistry;
  /**
   * Cell model
   */
  model: ICellModel;
  /**
   * SQL sources
   */
  sqlSources: ISqlSources;
}

/**
 * SQL cell toolbar widget.
 */
export class SQLCellToolbar extends VDomRenderer<SqlCellModel | null> {
  private _cellModel: ICellModel;
  private _commands: CommandRegistry;
  private _sqlSources: ISqlSources;

  /**
   * Creates a cell header.
   */
  constructor(options: ISQLCellToolbarOptions) {
    super();
    this._cellModel = options.model;
    this._commands = options.commands;
    this._sqlSources = options.sqlSources;

    this.modelChanged.connect(this._onModelChanged, this);
    this._updateWidgetModel();

    this._cellModel.sharedModel.changed.connect(
      this._onSharedModelChanged,
      this
    );
    this._sqlSources.changed.connect(this._onSQLSourcesChanged, this);
  }

  /**
   * Dispose the widget and its model.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this.model?.dispose();
    super.dispose();
  }

  protected render(): JSX.Element | null {
    return this.model ? (
      <Toolbar className={TOOLBAR_CLASS} aria-label="Cell SQL toolbar">
        <span style={{ margin: 'auto var(--toolbar-item-gap)' }}>Querying</span>
        <Select
          title="SQL source"
          onChange={this._onDatabaseChange}
          scale="xsmall"
          value={this.model.database}
        >
          <Option
            key="add"
            className="mito-sql-add-option"
            value={ADD_SOURCE_OPTION_VALUE}
            onClick={this._addDatabase}
          >
            <addIcon.react tag={null} slot="start" />
            Create new database connection
          </Option>
          {map(this._sqlSources, s => (
            <Option key={s.connectionName} value={s.connectionName}>
              {s.connectionName}
            </Option>
          ))}
        </Select>
        <span style={{ margin: 'auto var(--toolbar-item-gap)' }}>and saving the results to variable</span>
        <TextField
          aria-label="Variable name"
          title="Variable name"
          onInput={this._onVariableChange}
          onChange={this._onVariableChange}
          placeholder="Variable name"
          value={this.model.variableName}
        >
          <editIcon.react slot="end" tag={null} />
        </TextField>
      </Toolbar>
    ) : null;
  }

  private _addDatabase = async () => {
    if (this.model) {
      const newSource = await this._commands.execute(CommandIDs.addSource);
      const value = newSource?.connectionName;
      if (value) {
        this.model.database = value;
      }
    }
  };

  /**
   * Callback on the react select component.
   * 
   * It updates the model database with the newly selected value.
   */
  private _onDatabaseChange = (event: any) => {
    if (this.model && event.target.value !== ADD_SOURCE_OPTION_VALUE) {
      this.model.database = event.target.value;
    }
  };

  /**
   * Callback on the react textfield component.
   * 
   * It updates the model variable name with the newly typed name.
   */
  private _onVariableChange = (event: any) => {
    if (this.model) {
      this.model.variableName = event.target.value;
    }
  };

  /**
   * Callback on widget model change to connect it to the magic.
   * 
   * If the data model changes we need to listen for changes of the new one.
   */
  private _onModelChanged(): void {
    this.model?.stateChanged.connect(this._onStateChanged, this);
  }

  /**
   * Callback on widget model state change to update the magic.
   * 
   * This is triggered when the data model for the toolbar changes.
   * It updates the magic line in the cell to reflect the new state.
   */
  private _onStateChanged(): void {
    const magic =
      this._cellModel.type === 'code'
        ? MagicLine.getSQLMagic(this._cellModel as ICodeCellModel)
        : null;

    if (magic) {
      // Clear args and options to avoid unsupported combinations.
      magic.args = [];
      magic.options = magic.options['--section']
        ? {
            '--section': magic.options['--section']
          }
        : {};

      let needsUpdate = false;
      // Set undefined if variableName is empty string
      const variableName = this.model?.variableName || undefined;
      if (magic.output !== variableName) {
        magic.output = variableName;
        needsUpdate = true;
      }
      if (magic.options['--section'] !== this.model?.database) {
        if (this.model?.database) {
          magic.options['--section'] = this.model.database;
        } else {
          delete magic.options['--section'];
        }
        needsUpdate = true;
      }
      if (needsUpdate) {
        MagicLine.update(this._cellModel as ICodeCellModel, magic);
      }
    }
  }

  /**
   * Callback on shared model change.
   * 
   * When the cell content changes, we need to parse it again as it may add/remove the magic line.
   */
  private _onSharedModelChanged = (_: any, change: CellChange) => {
    if (this._cellModel.type !== 'code') {
      const oldModel = this.model;
      this.model = null;
      oldModel?.dispose();
      return;
    }

    // Avoid triggering the parsing of the cell too often by filtering
    // on the change position.
    if (change.sourceChange) {
      const firstLineLength = this._cellModel.sharedModel.source.indexOf('\n');

      if (firstLineLength === -1) {
        this._updateWidgetModel();
      } else {
        // If an object with the key 'retain' exists, it will give the position of the
        // change. Otherwise we assume the change occurs at position 0;
        const position =
          change.sourceChange.find(change => change.retain !== undefined)
            ?.retain || 0;

        // Check if the change occurs on the first line to update header and widgets.
        if (position <= firstLineLength) {
          this._updateWidgetModel();
        }
      }
    }
  };

  /**
   * Callback on SQL sources change.
   * 
   * It forces the component to re-render.
   */
  private _onSQLSourcesChanged(): void {
    if (this._cellModel.type === 'code') {
      this.update();
    }
  }

  /**
   * Parse the cell source to update the widget model.
   */
  private _updateWidgetModel(): void {
    const magic =
      this._cellModel.type === 'code'
        ? MagicLine.getSQLMagic(this._cellModel as ICodeCellModel)
        : null;

    if (magic?.isSQL) {
      if (!this.model) {
        this.model = new SqlCellModel();
      }
      this.model.database = magic.options['--section'] ?? '';
      this.model.variableName = magic.output ?? '';
    } else {
      const oldModel = this.model;
      this.model = null;
      oldModel?.dispose();
    }
  }
}
