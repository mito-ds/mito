/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { scrollToAndHighlightCell } from '../../../utils/notebook';
import { INotebookTracker } from '@jupyterlab/notebook';
import { getCellNumberById } from '../../../utils/cellReferences';
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

// Citation button component
export const Citation: React.FC<CitationProps> = ({ citationIndex, cellId, line, notebookTracker }): JSX.Element => {
  
  // Check if the cell exists in the current notebook
  const cellNumber = getCellNumberById(cellId, notebookTracker.currentWidget);
  const isMissing = cellNumber === undefined;

  const handleClick = (): void => {
    if (isMissing) return;
    
    const lineStart = typeof line === 'number' ? line : line.start;
    // In order to support old citations that have just one line, we 
    // we set the end line to the start line if only a single line number is provided.
    const lineEnd = typeof line === 'number' ? line : line.end;

    // Scroll to the cell and highlight the lines
    scrollToAndHighlightCell(notebookTracker.currentWidget, cellId, lineStart, lineEnd);
  };

  const className = isMissing ? 'citation-button citation-missing' : 'citation-button';
  const title = isMissing 
    ? 'Cell not found (may have been deleted or is in a different notebook)'
    : getLineDisplayText(line);

  return (
    <span
      className={className}
      onClick={handleClick}
      title={title}
    >
      {citationIndex}
    </span>
  );
};

export default Citation;