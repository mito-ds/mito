import type {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IToolbarWidgetRegistry, ReactWidget } from '@jupyterlab/apputils';
import type { CellType } from '@jupyterlab/nbformat';
import { NotebookActions, type Notebook, type NotebookPanel } from '@jupyterlab/notebook';
import { ITranslator, nullTranslator, type TranslationBundle } from '@jupyterlab/translation';
import { HTMLSelect } from '@jupyterlab/ui-components';
import * as React from 'react';

/**
 * The class name added to toolbar cell type dropdown wrapper.
 */
const TOOLBAR_CELLTYPE_CLASS = 'jp-Notebook-toolbarCellType';

/**
 * The class name added to toolbar cell type dropdown.
 */
const TOOLBAR_CELLTYPE_DROPDOWN_CLASS = 'jp-Notebook-toolbarCellTypeDropdown';

class CellTypeSelector extends ReactWidget {
  /**
   * Construct a new cell type switcher.
   */
  constructor(widget: Notebook, translator?: ITranslator) {
    super();
    this._trans = (translator || nullTranslator).load('jupyterlab');
    this.addClass(TOOLBAR_CELLTYPE_CLASS);
    this._notebook = widget;
    if (widget.model) {
      this.update();
    }
    widget.activeCellChanged.connect(this.update, this);
    // Follow a change in the selection.
    widget.selectionChanged.connect(this.update, this);
  }

  /**
   * Handle `change` events for the HTMLSelect component.
   */
  handleChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    if (event.target.value !== '-') {
      NotebookActions.changeCellType(
        this._notebook,
        event.target.value as CellType
      );
      this._notebook.activate();
    }
  };

  /**
   * Handle `keydown` events for the HTMLSelect component.
   */
  handleKeyDown = (event: React.KeyboardEvent): void => {
    if (event.keyCode === 13) {
      this._notebook.activate();
    }
  };

  render(): JSX.Element {
    let value = '-';
    if (this._notebook.activeCell) {
      value = this._notebook.activeCell.model.type;
    }
    for (const widget of this._notebook.widgets) {
      if (this._notebook.isSelectedOrActive(widget)) {
        if (widget.model.type !== value) {
          value = '-';
          break;
        }
      }
    }
    return (
      <HTMLSelect
        className={TOOLBAR_CELLTYPE_DROPDOWN_CLASS}
        onChange={this.handleChange}
        onKeyDown={this.handleKeyDown}
        value={value}
        aria-label={this._trans.__('Cell type')}
        title={this._trans.__('Select the cell type')}
      >
        <option value="-">-</option>
        <option value="code">{this._trans.__('Code')}</option>
        <option value="sql">{this._trans.__('SQL')}</option>
        <option value="markdown">{this._trans.__('Markdown')}</option>
        <option value="raw">{this._trans.__('Raw')}</option>
      </HTMLSelect>
    );
  }

  private _trans: TranslationBundle;
  private _notebook: Notebook;
}

/**
 * Plugin loading a custom cell type selector.
 */
export const cellTypeSwitcher: JupyterFrontEndPlugin<void> = {
  id: 'mito-sql-cell:cell-type-selector',
  description: 'Plugin providing a custom cell type selector toolbar item.',
  autoStart: true,
  requires: [IToolbarWidgetRegistry],
  optional: [ITranslator],
  activate: (
    app: JupyterFrontEnd,
    toolbarRegistry: IToolbarWidgetRegistry,
    translator: ITranslator | null
  ) => {
    toolbarRegistry.addFactory(
      'Notebook',
      'cellTypeSelector',
      (panel: NotebookPanel) => {
        return new CellTypeSelector(panel.content, translator ?? undefined);
      }
    );
  }
};
