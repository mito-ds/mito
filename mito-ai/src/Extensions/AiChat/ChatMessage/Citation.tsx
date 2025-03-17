import React from 'react';
import { scrollToCellLine } from '../../../utils/notebook';
import { INotebookTracker } from '@jupyterlab/notebook';
import '../../../../style/Citation.css';

// Citation component props interface
export interface CitationProps {
  cellId: string;
  line: number;
  context?: string;
  notebookTracker: INotebookTracker;
}

// Citation button component
export const Citation: React.FC<CitationProps> = ({ cellId, line, context, notebookTracker }) => {
  const handleClick = () => {
    console.log({ type: "citation", cell_id: cellId, line, context });

    console.log('scorlling to cell', cellId, 'line', line);
    
    // Use the new utility to scroll to the specific line in the cell
    scrollToCellLine(notebookTracker, cellId, line);
  };

  return (
    <span
      className="citation-button"
      onClick={handleClick}
      title={context || `Line ${line}`}
    >
      {line}
    </span>
  );
};

export default Citation; 