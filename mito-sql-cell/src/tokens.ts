import type { IObservableList } from '@jupyterlab/observables';
import type { ISignal } from '@lumino/signaling';

export namespace CommandIDs {
  export const addSource = 'mito-sql-cell:add-source';
  export const deleteSource = 'mito-sql-cell:delete-source';
  export const refreshSources = 'mito-sql-cell:refresh-sources';
}

/**
 * SQL source interface.
 */

export interface ISqlSource {
  /**
   * The unique name of the connection.
   */
  connectionName: string;
  /**
   * The connection URI.
   */
  database: string;
  /**
   * The driver to use.
   */
  driver: string;
}
/**
 * The interface for the SQL sources model.
 */

export interface ISqlSources extends IObservableList<ISqlSource> {
  readonly configurationFile: string;
  readonly error: string;
  stateChanged: ISignal<ISqlSources, string>;
  readonly isReady: boolean;
  refresh(): Promise<void>;
}
