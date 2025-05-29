/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Mock for global fetch
global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({ rules: ['Data Analysis', 'Visualization', 'Machine Learning'] }) }));
// Reset mock between tests
beforeEach(() => { global.fetch.mockClear(); });
