/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

export interface IAppDeployRequest {
  /**
   * The type of the message.
   */
  type: string;
  /**
   * The message ID.
   */
  message_id: string;
}

export interface IDeployAppRequest extends IAppDeployRequest {
  type: 'deploy_app'
  notebook_path: string,
  notebook_id: string | undefined,
  selected_files: string[],
  jwt_token?: string
}

/**
 * Completion error type.
 */
export type AppDeployError = {
  /**
   * The type of the error.
   */
  error_type: string;
  /**
   * The title of the error.
   */
  message: string;
  /**
   * The traceback of the error.
   */
  traceback?: string;
  /**
   * A hint to fix the error.
   */
  hint?: string;
};

/**
 * Response for fetching chat threads.
 */
export interface IDeployAppReply {
  /**
   * The type of the message.
   */
  type: 'deploy_app';

  /**
   * The parent message ID.
   */
  parent_id: string;

  /**
   * Url of deployed app
   */
  url: string;

  /**
   * Error information.
   */
  error?: AppDeployError;
}