import type { ICodeCellModel } from '@jupyterlab/cells';

/**
 * The jupysql configuration needed for Mito SQL.
 *
 * @param filename The configuration filename
 * @returns The configuration code snippet
 */
export function magicConfiguration(filename: string): string {
  return `# DO NOT EDIT this cell; it is required for Mito SQL cells to work.
# It must be executed prior to any SQL cell.
%load_ext mito_sql_cell`;
}

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

// Normalize magic options from short to long
const NORMALIZE_OPTIONS: Record<string, string> = {
  '-c': '--configfile',
  '-o': '--out'
};

/**
 * The MagicLine namespace.
 */
export namespace MagicLine {
  /**
   * SQL magic interface.
   */
  export interface ISQLMagic {
    /**
     * Whether the cell is a SQL cell.
     */
    isSQL: boolean;
    /**
     * The SQL database connection name.
     */
    connectionName: string;
    /**
     * The variable name in which to store the SQL query result.
     */
    output?: string;
    /**
     * The SQL connections configuration file.
     */
    configurationFile?: string;
  }

  /**
   * Parse the SQL magic from a cell model.
   *
   * If the cell model is not a SQL cell, it returns undefined.
   *
   * @param cellModel Code cell model to parse
   * @returns The SQL magic
   */
  export function getSQLMagic(cellModel: ICodeCellModel): ISQLMagic {
    const isSQL = isSQLCell(cellModel);
    const options: Record<string, string | undefined> = {};
    const args = new Array<string>();
    if (isSQL) {
      const firstLine = cellModel.sharedModel.source.split('\n', 1)[0];
      const parts = firstLine.split(/\s+/);

      let option: string | null = null;
      for (const part of parts.slice(1)) {
        if (part.startsWith('-')) {
          option = part.startsWith('--')
            ? part
            : (NORMALIZE_OPTIONS[part] ?? part);
          options[option] = undefined;
        } else {
          if (option) {
            options[option] = part;
            option = null;
          } else {
            args.push(part);
          }
        }
      }
    }
    return {
      isSQL,
      connectionName: args[0] ?? '',
      output: options['--out'],
      configurationFile: options['--configfile'],
    };
  }

  /**
   * Whether the code cell is a SQL cell or not.
   *
   * @param cellModel The code cell model
   * @returns The SQL status
   */
  export function isSQLCell(cellModel: ICodeCellModel): boolean {
    const firstLine = cellModel.sharedModel.source.split('\n', 1)[0];
    const matches = firstLine.match(new RegExp(`^${MAGIC}(\\s|$)`));
    return matches ? true : false;
  }

  function stringify(magic: ISQLMagic): string {
    if (!magic.isSQL) {
      return '';
    }

    let line = MAGIC;

    if(magic.configurationFile) {
      line += ` --configfile "${magic.configurationFile}"`;
    }
    if(magic.output) {
      line += ` --out ${magic.output}`;
    }
    line += ` ${magic.connectionName}`;

    return line;
  }

  /**
   * Update a cell with a SQL magic.
   *
   * @param cellModel Cell model to update
   * @param magic Magic to set
   */
  export function update(cellModel: ICodeCellModel, magic: ISQLMagic): void {
    const isSQL = isSQLCell(cellModel);
    const source = cellModel.sharedModel.source;
    let lines = source.split('\n');
    const magicLine = stringify(magic);
    if (isSQL) {
      if (magicLine) {
        lines[0] = magicLine;
      } else {
        lines = lines.slice(1);
      }
    } else {
      lines.unshift(magicLine);
    }

    cellModel.sharedModel.source = lines.join('\n');
  }
}
