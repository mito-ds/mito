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

export interface ICheckAppStatusRequest extends IAppManagerRequest {
  type: 'check-app-status';
  app_url: string;
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
    last_deployed_at: string;
  }>;

  /**
   * Error information.
   */
  error?: AppManagerError;
}

/**
 * Response for checking app status.
 */
export interface ICheckAppStatusReply {
  /**
   * The type of the message.
   */
  type: 'check-app-status';

  /**
   * Whether the app is accessible.
   */
  is_accessible: boolean;

  /**
   * Error information.
   */
  error?: AppManagerError;
}