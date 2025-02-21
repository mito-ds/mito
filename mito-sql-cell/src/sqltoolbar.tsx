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
import * as React from 'react';
import { MagicLine } from './common';
import { CommandIDs, type ISqlSources } from './tokens';
import type { CommandRegistry } from '@lumino/commands';

/**
 * The class of the toolbar.
 */
const TOOLBAR_CLASS = 'mito-sqlcell-toolbar';
const ADD_SOURCE_OPTION_VALUE = 'add-source';

/**
 * SQL toolbar model.
 */
export class SqlModel extends VDomModel {
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
export interface ISQLToolbarOptions {
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
 * SQL toolbar widget.
 */
export class SQLToolbar extends VDomRenderer<SqlModel | null> {
  private _cellModel: ICellModel;
  private _commands: CommandRegistry;
  private _sqlSources: ISqlSources;

  /**
   * Creates a cell header.
   */
  constructor(options: ISQLToolbarOptions) {
    super();
    this._cellModel = options.model;
    this._commands = options.commands;
    this._sqlSources = options.sqlSources;
    this.addClass(TOOLBAR_CLASS);

    this.modelChanged.connect(this._onModelChanged, this);
    this._parseSource();

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
      <Toolbar aria-label="Cell SQL toolbar">
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
            Connect to a database…
          </Option>
          {map(this._sqlSources, s => (
            <Option key={s.connectionName} value={s.connectionName}>
              {s.connectionName}
            </Option>
          ))}
        </Select>
        <span style={{ margin: 'auto var(--toolbar-item-gap)' }}>saved to</span>
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
   */
  private _onDatabaseChange = (event: any) => {
    if (this.model && event.target.value !== ADD_SOURCE_OPTION_VALUE) {
      this.model.database = event.target.value;
    }
  };

  /**
   * Callback on the react textfield component.
   */
  private _onVariableChange = (event: any) => {
    if (this.model) {
      this.model.variableName = event.target.value;
    }
  };

  /**
   * Callback on widget model change to connect it to the magic.
   */
  private _onModelChanged(): void {
    this.model?.stateChanged.connect(this._onStateChanged, this);
  }

  /**
   * Callback on widget model state change to update the magic.
   */
  private _onStateChanged(): void {
    const magic =
      this._cellModel.type === 'code'
        ? MagicLine.parse(this._cellModel as ICodeCellModel)
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
        this._parseSource();
      } else {
        // If an object with the key 'retain' exists, it will give the position of the
        // change. Otherwise we assume the change occurs at position 0;
        const position =
          change.sourceChange.find(change => change.retain !== undefined)
            ?.retain || 0;

        // Check if the change occurs on the first line to update header and widgets.
        if (position <= firstLineLength) {
          this._parseSource();
        }
      }
    }
  };

  /**
   * Callback on SQL sources change.
   */
  private _onSQLSourcesChanged(): void {
    if (this._cellModel.type === 'code') {
      this.update();
    }
  }

  /**
   * Parse the cell source to update the widget model.
   */
  private _parseSource(): void {
    const magic =
      this._cellModel.type === 'code'
        ? MagicLine.parse(this._cellModel as ICodeCellModel)
        : null;

    if (magic?.isSQL) {
      if (!this.model) {
        this.model = new SqlModel();
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
