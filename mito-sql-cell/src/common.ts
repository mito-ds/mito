import type { ICodeCellModel } from '@jupyterlab/cells';

/**
 * The code to inject to the kernel to load the sql magic.
 */
export const LOAD_MAGIC = '%load_ext sql';

/**
 * The expected magic.
 */
export const MAGIC = '%%sql';

/**
 * Custom code cell interface.
 */
export interface IMitoCodeCell {
  /**
   * The cell model.
   */
  model: ICodeCellModel;
  /**
   * The SQL status.
   */
  isSQL: boolean;
}

/**
 * The MagicLine namespace.
 */
export namespace MagicLine {
  /**
   * Return the database URL from the magic line of a cell.
   *
   * @param cellModel - the model of the cell to look for the database URL.
   */
  export function getDatabaseUrl(
    cellModel: ICodeCellModel | undefined
  ): string | undefined {
    if (!cellModel) {
      return;
    }
    const magicLine = cellModel.sharedModel.source.split('\n')[0];
    const regexp = new RegExp(`^${MAGIC}\\s+([^\\s]+)`);
    const match = magicLine.match(regexp);
    if (match && match.length > 1) {
      return match[1];
    }
  }

  /**
   * Update the contents of the magic line of the cell, accordingly to the selection.
   *
   * @param cellModel - the model of the cell whose contents are to be modified.
   * @param database - the selected database.
   */
  export function setDatabaseUrl(
    cellModel: ICodeCellModel,
    database?: string
  ): void {
    const sourceArray = cellModel.sharedModel.source.split('\n');
    const magicLine = sourceArray[0].split(/\s+/);
    if (database) {
      magicLine[1] = `${database}`;
    }
    sourceArray[0] = magicLine.join(' ');
    cellModel.sharedModel.source = sourceArray.join('\n');
  }

  /**
   * Return the variable from the magic line of a cell.
   *
   * @param cellModel - the model of the cell to look for the database URL.
   */
  export function getVariable(cellModel: ICodeCellModel): IVariable {
    const magicLine = cellModel.sharedModel.source.split('\n')[0];
    const regexp = new RegExp(`^${MAGIC}.*\\s(\\w+)(=?)\\s*<<$`);
    const match = magicLine.match(regexp);
    if (match && match.length > 1) {
      return { value: match[1], displayOutput: match[2] === '=' };
    }
    return { value: '', displayOutput: false };
  }

  /**
   * Update the content of the magic line to save the result in a variable.
   *
   * @param cellModel - the model of the cell whose contents are to be modified.
   * @param value - the name of the variable.
   */
  export function setVariable(
    cellModel: ICodeCellModel,
    variable: IVariable
  ): void {
    const sourceArray = cellModel.sharedModel.source.split('\n');
    let magicLine = sourceArray[0];
    const regexp = new RegExp(`^${MAGIC}.*(\\s\\w+=?\\s*<<)$`);
    const match = magicLine.match(regexp);

    const variableText = variable.value
      ? ` ${variable.value}${variable.displayOutput ? '=' : ''} <<`
      : '';

    if (match) {
      magicLine = magicLine.replace(match[1], variableText);
    } else {
      magicLine += `${variableText}`;
    }
    sourceArray[0] = magicLine;
    cellModel.sharedModel.source = sourceArray.join('\n');
  }

  export interface IVariable {
    /**
     * The variable name.
     */
    value: string;
    /**
     * Whether the output should be displayed or not.
     */
    displayOutput: boolean;
  }
}
