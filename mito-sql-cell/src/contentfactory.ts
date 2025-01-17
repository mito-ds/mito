import { CellChange, ISharedCodeCell } from '@jupyter/ydoc';
import { Cell, CodeCell, ICellHeader } from '@jupyterlab/cells';
import { NotebookPanel } from '@jupyterlab/notebook';
import { ReactiveToolbar } from '@jupyterlab/ui-components';
import { Message } from '@lumino/messaging';
import { ISignal, Signal } from '@lumino/signaling';
import { PanelLayout, SingletonLayout, Widget } from '@lumino/widgets';
import { IMitoCodeCell, MAGIC, MagicLine } from './common';
import { DatabaseSelect, VariableName } from './widgets';
import type { ISqlSources } from './sources';

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
      widget => widget instanceof CellHeader
    ) as CellHeader;

    this._header.createToolbar(this);
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

  private _header: CellHeader | undefined = undefined;
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
    return new CellHeader({ sqlSources });
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

/**
 * The cell header widget.
 */
export class CellHeader extends Widget implements ICellHeader {
  /**
   * Creates a cell header.
   */
  constructor(options: { sqlSources: ISqlSources }) {
    super();
    this.layout = new SingletonLayout();
    this._sqlSources = options.sqlSources;
    this._toolbar = new ReactiveToolbar();
  }

  /**
   * Set the cell model to the header.
   *
   * It adds a listener on the cell content to display or not the toolbar.
   */
  createToolbar(cell: MitoCodeCell) {
    const databaseSelect = new DatabaseSelect({
      cellModel: cell?.model,
      sqlSources: this._sqlSources,
      databaseChanged: cell.databaseChanged
    });

    this._toolbar.addItem('select', databaseSelect);

    const variableName = new VariableName({
      cell,
      variableChanged: cell.variableChanged
    });
    this._toolbar.addItem('variable', variableName);
  }

  /**
   * Set the cell as SQL or not, and displaying the toolbar header.
   *
   * @param status - boolean, whether the cell is SQL or not.
   */
  setCellSql(status: boolean) {
    if (status) {
      this.addClass(HEADER_CLASS);
      (this.layout as SingletonLayout).widget = this._toolbar;
    } else {
      this.removeClass(HEADER_CLASS);
      (this.layout as SingletonLayout).removeWidget(this._toolbar);
    }
  }

  /**
   * Triggered before the widget is detached.
   */
  protected onBeforeDetach(msg: Message): void {
    (this.layout as SingletonLayout).removeWidget(this._toolbar);
  }

  private _sqlSources: ISqlSources;
  private _toolbar: ReactiveToolbar;
}
