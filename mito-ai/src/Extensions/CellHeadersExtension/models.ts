/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { Cell } from '@jupyterlab/cells';
import { NotebookPanel } from '@jupyterlab/notebook';

/**
 * Interface for cells that have been enhanced with header functionality
 * Note: This is for documentation purposes - actual cells remain their original types
 */
export interface IEnhancedCellMethods {
  setCellNumber(cellNumber: number): void;
  getCellNumber(): number;
  _headerNode?: HTMLDivElement;
  _cellNumber?: number;
}

/**
 * Type guard to check if a cell has been enhanced with header functionality
 */
export function hasHeaderFunctionality(cell: Cell): cell is Cell & IEnhancedCellMethods {
  return typeof (cell as any).setCellNumber === 'function';
}

export interface ICellNumberingService {
  registerNotebook(notebook: NotebookPanel): void;
  updateCellNumbers(notebook: NotebookPanel): void;
}