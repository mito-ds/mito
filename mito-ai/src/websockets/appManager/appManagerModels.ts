/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// appManagerModels.ts
export interface IAppManagerRequest {
  /**
   * The type of the message.
   */
  type: string;
}

export interface IManageAppRequest extends IAppManagerRequest {
  type: 'manage-app';
  jwt_token?: string;
}

/**
 * Completion error type.
 */
export type AppManagerError = {
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
};

/**
 * Response for managing apps.
 */
export interface IManageAppReply {
  /**
   * The type of the message.
   */
  type: 'manage-app';

  /**
   * List of apps.
   */
  apps: Array<{
    app_name: string;
    url: string;
    status: string;
    created_at: string;
  }>;

  /**
   * Error information.
   */
  error?: AppManagerError;
}