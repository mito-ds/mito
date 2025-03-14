import React from 'react';
import { scrollToCellLine } from '../../../utils/notebook';
import { INotebookTracker } from '@jupyterlab/notebook';

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
      style={{
        backgroundColor: '#f0f7ff',
        border: '1px solid #ccc',
        borderRadius: '12px',
        padding: '2px 8px',
        fontSize: '0.75em',
        cursor: 'pointer',
        margin: '0 2px',
        color: '#0366d6',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {line}
    </span>
  );
};

export default Citation; 