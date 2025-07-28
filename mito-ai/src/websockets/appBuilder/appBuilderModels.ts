/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

export interface IAppBuilderRequest {
  /**
   * The type of the message.
   */
  type: string;
  /**
   * The message ID.
   */
  message_id: string;
}

export interface IBuildAppRequest extends IAppBuilderRequest {
  type: 'build-app'
  notebook_path: string
  jwt_token?: string
}

/**
 * Completion error type.
 */
export type AppBuilderError = {
  /**
   * The type of the error.
   */
  error_type: string;
  /**
   * The title of the error.
   */
  title: string;
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
export interface IBuildAppReply {
  /**
   * The type of the message.
   */
  type: 'build-app';

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
  error?: AppBuilderError;
}