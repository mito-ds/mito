/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

jest.mock('@jupyterlab/notebook', () => {
  const actual = jest.requireActual('@jupyterlab/notebook');
  return {
    ...actual,
    NotebookActions: {
      ...actual.NotebookActions,
      runCells: jest.fn().mockResolvedValue(undefined)
    }
  };
});

import { NotebookActions } from '@jupyterlab/notebook';
import {
  getCellWidgetsStrictlyBelow,
  runAllCellsStrictlyBelow
} from '../../utils/notebook';

describe('getCellWidgetsStrictlyBelow', () => {
  it('returns an empty array when there are no cells below origin', () => {
    const notebook = { widgets: [{ id: 'a' }] };
    expect(getCellWidgetsStrictlyBelow(notebook as never, 0)).toEqual([]);
  });

  it('returns all widgets after the origin index', () => {
    const w = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const notebook = { widgets: w };
    expect(getCellWidgetsStrictlyBelow(notebook as never, 0)).toEqual([{ id: 'b' }, { id: 'c' }]);
    expect(getCellWidgetsStrictlyBelow(notebook as never, 1)).toEqual([{ id: 'c' }]);
  });
});

describe('runAllCellsStrictlyBelow', () => {
  beforeEach(() => {
    (NotebookActions.runCells as jest.Mock).mockClear();
  });

  it('resolves without calling runCells when there is nothing to run', async () => {
    const notebook = { widgets: [{ id: 'only' }] };
    await runAllCellsStrictlyBelow(notebook as never, 0, null);
    expect(NotebookActions.runCells).not.toHaveBeenCalled();
  });

  it('calls NotebookActions.runCells with cells strictly below origin', async () => {
    const c0 = { id: '0' };
    const c1 = { id: '1' };
    const c2 = { id: '2' };
    const notebook = { widgets: [c0, c1, c2] };
    const sessionContext = { mock: true };
    await runAllCellsStrictlyBelow(notebook as never, 0, sessionContext as never);
    expect(NotebookActions.runCells).toHaveBeenCalledTimes(1);
    expect(NotebookActions.runCells).toHaveBeenCalledWith(notebook, [c1, c2], sessionContext);
  });
});
