/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { scrollToCell, scrollToCellWithRange, getCellCodeByID } from '../../../utils/notebook';
import { INotebookTracker } from '@jupyterlab/notebook';
import '../../../../style/Citation.css';

// Citation line can be either a single line number or a range of lines
export type CitationLine = number | { start: number; end: number };

// Citation component props interface
export interface CitationProps {
  citationIndex: number;
  cellId: string;
  line: CitationLine;
  notebookTracker: INotebookTracker;
}

// Helper function to get the display text for a line/range
const getLineDisplayText = (line: CitationLine): string => {
  if (typeof line === 'number') {
    return `Line ${line}`;
  } else {
    return `Lines ${line.start}-${line.end}`;
  }
};

// Helper function to get the scroll target line
const getScrollTargetLine = (line: CitationLine): number => {
  if (typeof line === 'number') {
    return line;
  } else {
    // For ranges, scroll to the start of the range
    return line.start;
  }
};

// Citation button component
export const Citation: React.FC<CitationProps> = ({ citationIndex, cellId, line, notebookTracker }): JSX.Element => {
  const handleClick = (): void => {
    // Use different scroll functions for single line vs range
    if (typeof line === 'number') {
      // Single line citation - uses the new scrollToCell approach
      scrollToCell(notebookTracker, cellId, line);
    } else {
      // Multiline citation - use the new range function
      scrollToCellWithRange(notebookTracker, cellId, line.start, line.end);
    }
  };

  return (
    <span
      className="citation-button"
      onClick={handleClick}
      title={getLineDisplayText(line)}
    >
      {citationIndex}
    </span>
  );
};

export default Citation;