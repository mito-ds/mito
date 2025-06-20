/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { scrollToCell } from '../../../utils/notebook';
import { INotebookTracker } from '@jupyterlab/notebook';
import '../../../../style/Citation.css';

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
    scrollToCell(notebookTracker, cellId, line);
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