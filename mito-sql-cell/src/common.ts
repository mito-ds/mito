import type { ICodeCellModel } from '@jupyterlab/cells';

/**
 * The jupysql configuration needed for Mito SQL.
 *
 * @param filename The configuration filename
 * @returns The configuration code snippet
 */
export function magicConfiguration(filename: string): string {
  return `# This cell is required to use Mito SQL cells within the notebook.
# It must be executed prior to any SQL cell.
%load_ext sql
%config SqlMagic.autopandas=True
%config SqlMagic.dsn_filename=${filename}`;
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
// See list at https://github.com/ploomber/jupysql/blob/6be0d4b5171dc4051eb36691067070b132e5ae61/src/sql/magic.py#L257
const NORMALIZE_OPTIONS: Record<string, string> = {
  '-l': '--connections',
  '-x': '--close',
  '-c': '--creator',
  '-s': '--section',
  '-p': '--persist',
  '-P': '--persist-replace',
  '-n': '--no-index',
  '--append': '--append',
  '-a': '--connection_arguments',
  '-f': '--file',
  '-S': '--save',
  '-w': '--with',
  '-N': '--no-execute',
  '-A': '--alias',
  '--interact': '--interact'
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
     * The variable name in which to store the SQL query result.
     */
    output?: string;
    /**
     * Magic arguments.
     */
    args: string[];
    /**
     * Magic options.
     */
    options: Record<string, string | undefined>;
  }

  /**
   * Parse the SQL magic from a cell model.
   *
   * If the cell model is not a SQL cell, it returns undefined.
   *
   * @param cellModel Code cell model to parse
   * @returns The SQL magic
   */
  export function parse(cellModel?: ICodeCellModel): ISQLMagic | undefined {
    if (!cellModel) {
      return;
    }

    const isSQL = isSQLCell(cellModel);
    let output: string | undefined;
    const options: Record<string, string | undefined> = {};
    const args = new Array<string>();
    if (isSQL) {
      const firstLine = cellModel.sharedModel.source.split('\n', 1)[0];
      const parts = firstLine.split(/\s+/);
      const hasOutput = parts[parts.length - 1] == '<<';
      if (hasOutput) {
        output = parts[parts.length - 2].replace(/=?$/, '');
      }

      let option: string | null = null;
      for (const part of parts.slice(1, hasOutput ? -2 : undefined)) {
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
      output,
      args,
      options
    };
  }

  function isSQLCell(cellModel: ICodeCellModel): boolean {
    const firstLine = cellModel.sharedModel.source.split('\n', 1)[0];
    const matches = firstLine.match(new RegExp(`^${MAGIC}(\s|$)`));
    return matches ? true : false;
  }

  function stringify(magic: ISQLMagic): string {
    if (!magic.isSQL) {
      return '';
    }

    let line = MAGIC;

    for (const [key, value] of Object.entries(magic.options)) {
      if (value) {
        line += ` ${key} ${value}`;
      } else {
        line += ` ${key}`;
      }
    }

    for (const arg of magic.args) {
      line += ` ${arg}`;
    }

    if (magic.output) {
      line += ` ${magic.output} <<`;
    }

    return line;
  }

  /**
   * Update a cell with a SQL magic.
   *
   * @param cellModel Cell model to update
   * @param magic Magic to set
   */
  export function updateMagic(
    cellModel: ICodeCellModel,
    magic: ISQLMagic
  ): void {
    const isSQL = isSQLCell(cellModel);
    const source = cellModel.sharedModel.source;
    const lines = source.split('\n', 1);
    const magicLine = stringify(magic);
    if (isSQL) {
      lines[0] = magicLine;
    } else {
      lines.unshift(magicLine);
    }

    cellModel.sharedModel.source = lines.join('\n');
  }
}
