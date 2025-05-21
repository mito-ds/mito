/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

export interface DBConnection {
    type: string;
    username: string;
    password: string;
    account: string;
    warehouse: string;
}

export interface DBConnections {
    [key: string]: DBConnection;  // key is now UUID
} 