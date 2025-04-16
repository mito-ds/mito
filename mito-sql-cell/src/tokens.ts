/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import type { IObservableList } from '@jupyterlab/observables';
import type { ISignal } from '@lumino/signaling';

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
  /**
   * The configuration file path.
   */
  readonly configurationFile: string;
  /**
   * Error when requesting the backend.
   */
  readonly error: string;
  /**
   * Model state changed signal.
   */
  stateChanged: ISignal<ISqlSources, string>;
  /**
   * Whether the sources are ready or not.
   */
  readonly isReady: boolean;
  /**
   * Refresh the sources from the backend.
   */
  refresh(): Promise<void>;
}
