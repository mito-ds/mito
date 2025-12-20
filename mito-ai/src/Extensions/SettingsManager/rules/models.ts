/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

export interface Rule {
    name: string;
    description: string;
    googleDriveUrl?: string;
    lastUpdated?: string;
    ruleType: 'manual' | 'google_doc';
}