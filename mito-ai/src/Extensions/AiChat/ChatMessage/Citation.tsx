/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { getCellCodeByID, getCellByID, setActiveCellByID } from '../../../utils/notebook';
import { INotebookTracker } from '@jupyterlab/notebook';
import '../../../../style/Citation.css';
import { WindowedList } from '@jupyterlab/ui-components';

// Citation component props interface
export interface CitationProps {
  citationIndex: number;
  cellId: string;
  line: number;
  notebookTracker: INotebookTracker;
}

// Citation button component
// Citation button component
export const Citation: React.FC<CitationProps> = ({ citationIndex, cellId, line, notebookTracker }): JSX.Element => {
  const handleClick = (): void => {
    // To determine how we should handle scrolling, 
    // we need to first count the number of lines in the cell.
    // If the line is closer to the top, 
    // we set the scroll position to "start," otherwise we set it to "end."
    const code = getCellCodeByID(notebookTracker, cellId);
    const relativeLinePosition = line / (code?.split('\n').length || 1);

    // These positions must be of type BaseScrollToAlignment defined in @jupyterlab/ui-components
    const position: WindowedList.BaseScrollToAlignment = relativeLinePosition < 0.5 ? 'start' : 'end';

    const cell = getCellByID(notebookTracker, cellId);

    if (cell == null) {
      console.log('cell is null');
      return
    }

    console.log('position', position);
    setActiveCellByID(notebookTracker, cellId);
    notebookTracker.currentWidget?.content.scrollToCell(cell, position);
    console.log('scrolled to cell', cell);
  };

  return (
    <span
      className="citation-button"
      onClick={handleClick}
      title={`Line ${line}`}
    >
      {citationIndex}
    </span>
  );
};

export default Citation; 