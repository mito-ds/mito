/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { isIpywidgetsTraitUpdateCommContent } from '../../Extensions/NotebookViewMode/documentReactiveRunner';

describe('isIpywidgetsTraitUpdateCommContent', () => {
  it.each([
    [
      'ipywidgets trait sync',
      { comm_id: 'abc', data: { method: 'update', state: { value: '2024-01-01' } } },
      true
    ],
    ['missing data', { comm_id: 'abc' }, false],
    ['non-object data', { comm_id: 'abc', data: 'x' }, false],
    [
      'custom comm (e.g. view chrome)',
      { comm_id: 'abc', data: { method: 'custom', content: {} } },
      false
    ],
    ['update without state', { comm_id: 'abc', data: { method: 'update' } }, false],
    ['null state', { comm_id: 'abc', data: { method: 'update', state: null } }, false]
  ])('%s', (_label, content, expected) => {
    expect(isIpywidgetsTraitUpdateCommContent(content)).toBe(expected);
  });
});
