import { CellChange, ISharedCodeCell } from '@jupyter/ydoc';
import { Cell, CodeCell, ICellHeader } from '@jupyterlab/cells';
import { NotebookPanel } from '@jupyterlab/notebook';
import { VDomModel, VDomRenderer } from '@jupyterlab/ui-components';
import { ISignal, Signal } from '@lumino/signaling';
import { PanelLayout } from '@lumino/widgets';
import * as React from 'react';
import { IMitoCodeCell, MAGIC, MagicLine } from './common';
import type { ISqlSources } from './sources';
import { Option, Select, TextField, Toolbar } from '@jupyter/react-components';

/**
 * The class of the header.
 */
const HEADER_CLASS = 'mito-sqlcell-header';

/**
 * The notebook content factory.
 */
export class NotebookContentFactory
  extends NotebookPanel.ContentFactory
  implements NotebookPanel.IContentFactory
{
  constructor(options: ContentFactory.IOptions) {
    super(options);
    this._sqlSources = options.sqlSources;
  }

  /**
   * Creates a new code cell widget, using a custom content factory.
   */
  createCodeCell(options: CodeCell.IOptions): CodeCell {
    const editorFactory = options.contentFactory.editorFactory;
    const sqlSources = this._sqlSources;
    const cellContentFactory = new CellContentFactory({
      sqlSources,
      editorFactory
    });
    const cell = new MitoCodeCell({
      ...options,
      contentFactory: cellContentFactory,
      sqlSources
    }).initializeState();
    return cell;
  }

  private _sqlSources: ISqlSources;
}

/**
 * The namespace for Notebook content factory.
 */
export namespace ContentFactory {
  /**
   * The content factory options.
   */
  export interface IOptions extends CellContentFactory.IOptions {}
}

/**
 * A custom code cell to copy the output in a variable when the cell is executed.
 */
class MitoCodeCell extends CodeCell implements IMitoCodeCell {
  constructor(options: MitoCodeCell.IOptions) {
    super(options);
    this._sqlSources = options.sqlSources;
    this.model.sharedModel.changed.connect(this._onSharedModelChanged, this);
  }

  /**
   * Getter and setter of the SQL status.
   */
  get isSQL(): boolean {
    return this._isSQL;
  }
  set isSQL(value: boolean) {
    this._isSQL = value;
    this._header?.setCellSql(value);
  }

  /**
   * A signal emitted when the first line changed.
   */
  get databaseChanged(): ISignal<IMitoCodeCell, string> {
    return this._databaseChanged;
  }

  /**
   * A signal emitted when the first line changed.
   */
  get variableChanged(): ISignal<IMitoCodeCell, MagicLine.IVariable> {
    return this._variableChanged;
  }

  protected initializeDOM(): void {
    super.initializeDOM();
    this._header = (this.layout as PanelLayout).widgets.find(
      widget => widget instanceof MitoCellHeader
    ) as MitoCellHeader;

    this._checkSource();
  }

  /**
   * Check the source of the cell for the MAGIC command, and attach or detach
   * the toolbar if necessary.
   */
  private _checkSource(): boolean {
    const sourceStart = this.model.sharedModel.source.substring(
      0,
      MAGIC.length
    );
    if (sourceStart === MAGIC && !this.isSQL) {
      this.isSQL = true;
    } else if (sourceStart !== MAGIC && this.isSQL) {
      this.isSQL = false;
    }
    return this.isSQL;
  }

  /**
   * Triggered when the shared model change.
   */
  private _onSharedModelChanged = (_: ISharedCodeCell, change: CellChange) => {
    if (change.sourceChange) {
      const firstLine = this.model.sharedModel.source.split('\n')[0];

      // If an object with the key 'retain' exists, it will give the position of the
      // change. Otherwise we assume the change occurs at position 0;
      const position =
        change.sourceChange.find(change => change.retain !== undefined)
          ?.retain || 0;

      // Check if the change occurs on the first line to update header and widgets.
      if (position <= firstLine.length) {
        if (this._checkSource()) {
          const databaseURL = MagicLine.getDatabaseUrl(this.model);
          const databaseAlias =
            this._sqlSources.sources.find(db => db === databaseURL) ?? ' - ';
          this._databaseChanged.emit(databaseAlias);

          const variable = MagicLine.getVariable(this.model);
          this._variableChanged.emit(variable);
        }
      }
    }
  };

  private _header: MitoCellHeader | undefined = undefined;
  private _sqlSources: ISqlSources;
  private _isSQL = false;
  private _databaseChanged = new Signal<IMitoCodeCell, string>(this);
  private _variableChanged = new Signal<IMitoCodeCell, MagicLine.IVariable>(
    this
  );
}

/**
 * The namespace for custom code cell.
 */
namespace MitoCodeCell {
  /**
   * The custom code cell options.
   */
  export interface IOptions extends CodeCell.IOptions {
    /**
     * The databases panel, containing the known databases.
     */
    sqlSources: ISqlSources;
  }
}

/**
 * The cell content factory.
 */
export class CellContentFactory
  extends Cell.ContentFactory
  implements Cell.IContentFactory
{
  /**
   * Create a content factory for a cell.
   */
  constructor(options: CellContentFactory.IOptions) {
    super(options);
    this._sqlSources = options.sqlSources;
  }

  /**
   * Create a new cell header for the parent widget.
   */
  createCellHeader(): ICellHeader {
    const sqlSources = this._sqlSources;
    return new MitoCellHeader({ sqlSources });
  }

  private _sqlSources: ISqlSources;
}

/**
 * The namespace for cell content factory.
 */
export namespace CellContentFactory {
  /**
   * The content factory options.
   */
  export interface IOptions extends Cell.ContentFactory.IOptions {
    /**
     * The databases panel, containing the known databases.
     */
    sqlSources: ISqlSources;
  }
}

class SqlModel extends VDomModel {
  private _database = '';
  private _variableName = '';

  get database(): string {
    return this._database;
  }
  set database(v: string) {
    if (v !== this._database) {
      this._database = v;
      this.stateChanged.emit();
    }
  }

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
 * The cell header widget.
 */
export class MitoCellHeader
  extends VDomRenderer<SqlModel | null>
  implements ICellHeader
{
  /**
   * Creates a cell header.
   */
  constructor(options: { sqlSources: ISqlSources }) {
    super();
    this._sqlSources = options.sqlSources;
    this.addClass(HEADER_CLASS);
  }

  protected render(): JSX.Element | null {
    return this.model ? (
      <Toolbar>
        <Select scale='xsmall'>
          {this._sqlSources.sources.map(s => (
            <Option>{s}</Option>
          ))}
        </Select>
        <span>saved to</span>
        <TextField placeholder="Variable">{this.model.variableName}</TextField>
      </Toolbar>
    ) : null;
  }

  /**
   * Set the cell as SQL or not, and displaying the toolbar header.
   *
   * @param status - boolean, whether the cell is SQL or not.
   */
  setCellSql(status: boolean) {
    if (status) {
      this.model = new SqlModel();
    } else {
      this.removeClass(HEADER_CLASS);
      this.model = null;
    }
  }

  private _sqlSources: ISqlSources;
}
