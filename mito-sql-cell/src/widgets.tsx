import { ICodeCellModel } from '@jupyterlab/cells';
import { ReactWidget, UseSignal } from '@jupyterlab/ui-components';
import { ISignal } from '@lumino/signaling';
import React from 'react';

import { IMitoCodeCell, MagicLine } from './common';
import { ISqlSources } from './sources';

/**
 * Database select widget.
 */
export class DatabaseSelect extends ReactWidget {
  constructor(options: {
    cellModel: ICodeCellModel | undefined;
    sqlSources: ISqlSources;
    databaseChanged: ISignal<IMitoCodeCell, string>;
  }) {
    super();
    this._cellModel = options.cellModel;
    this._sqlSources = options.sqlSources;
    this._databaseChanged = options.databaseChanged;
  }

  onChange = (event: React.FormEvent) => {
    const selection = (event.target as HTMLSelectElement).value;
    const database = this._sqlSources.sources.find(s => selection == s);
    if (this._cellModel && database) {
      MagicLine.setDatabaseUrl(this._cellModel, database);
    }
  };

  render(): JSX.Element {
    const defaultValue = ' - ';
    let currentDatabase = defaultValue;
    const url = MagicLine.getDatabaseUrl(this._cellModel);
    const aliases: string[] = [];
    this._sqlSources?.sources.forEach(database => {
      aliases.push(database);
      if (database === url) {
        currentDatabase = database;
      }
    });
    return (
      <label>
        Database:&nbsp;
        <UseSignal signal={this._databaseChanged} initialArgs={currentDatabase}>
          {(_, databaseURL) => {
            return (
              <select
                onChange={this.onChange}
                className={'jp-sqlcell-select'}
                disabled={this._cellModel?.type !== 'code'}
              >
                <option disabled selected={databaseURL === defaultValue}>
                  {defaultValue}
                </option>
                {aliases.map(alias => {
                  return (
                    <option selected={databaseURL === alias}>{alias}</option>
                  );
                })}
              </select>
            );
          }}
        </UseSignal>
      </label>
    );
  }

  private _cellModel: ICodeCellModel | undefined;
  private _sqlSources: ISqlSources;
  private _databaseChanged: ISignal<IMitoCodeCell, string>;
}

/**
 * An input to set the variable name, where to store the output of sql.
 *
 * @param fn : the callback function.
 */
export class VariableName extends ReactWidget {
  constructor(options: {
    cell: IMitoCodeCell;
    variableChanged: ISignal<IMitoCodeCell, MagicLine.IVariable>;
  }) {
    super();
    this._cell = options.cell;
    this._variable = MagicLine.getVariable(this._cell.model);
    this._variableChanged = options.variableChanged;
  }

  /**
   * Triggered when typing in the input.
   */
  private _onVariableChange = (event: React.ChangeEvent) => {
    const target = event.target as HTMLInputElement;
    const temp = target.value;

    // Allow only variable pattern
    this._variable.value = temp.replace(/^[^a-zA-Z_]|[^\w]/g, '');
    if (this._variable.value !== temp) {
      const cursorPosition = target.selectionStart ?? 1;
      target.value = this._variable.value;
      // Restore the position of the cursor.
      target.setSelectionRange(cursorPosition - 1, cursorPosition - 1);
    }
    MagicLine.setVariable(this._cell?.model, this._variable);
  };

  /**
   * triggered when the checkbox value changes.
   */
  private _onDisplayOutputChange = (event: React.ChangeEvent) => {
    this._variable.displayOutput = (event.target as HTMLInputElement).checked;
    MagicLine.setVariable(this._cell?.model, this._variable);
  };

  render() {
    return (
      <UseSignal signal={this._variableChanged} initialArgs={this._variable}>
        {(_, variable) => (
          <div className={'jp-sqlcell-variable'}>
            <input
              type={'text'}
              placeholder={'Variable name'}
              onChange={this._onVariableChange}
              title={'The variable where to copy the cell output'}
              value={variable?.value}
            ></input>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label htmlFor={'display-output'}>Display output</label>
              <input
                type={'checkbox'}
                onChange={this._onDisplayOutputChange}
                aria-label={'Display the query output'}
                name={'display-output'}
                checked={variable?.displayOutput}
              />
            </div>
          </div>
        )}
      </UseSignal>
    );
  }

  private _cell: IMitoCodeCell;
  private _variable: MagicLine.IVariable;
  private _variableChanged: ISignal<IMitoCodeCell, MagicLine.IVariable>;
}
