import React from 'react';

interface CellHeaderProps {
  number: number;
}

const CellHeader: React.FC<CellHeaderProps> = ({ number }) => {
  return (
    <div
      className="cell-number"
      style={{
        fontSize: '12px',
        color: '#666',
        background: '#f5f5f5',
        padding: '2px 8px',
        borderRadius: '3px',
        marginBottom: '4px',
        fontFamily: 'monospace',
        border: '1px solid #ddd'
      }}
    >
      Cell {number}
    </div>
  );
};

export default CellHeader;
