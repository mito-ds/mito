import React from 'react';

interface HighlightedCellDataProps {
    cellData: string;
    searchValue?: string;
}

export const HighlightedCellData: React.FC<HighlightedCellDataProps> = (props) => {
    const { searchValue, cellData } = props;
    if (searchValue === undefined) {
        return <div>{cellData}</div>;
    }

    const searchValueIndex = cellData.toLowerCase().indexOf(searchValue.toLowerCase());
    let highlightedCellData = cellData;
    if (searchValueIndex === -1) {
        return <div>{cellData}</div>;
    }
    return (<div>
        {highlightedCellData.slice(0, searchValueIndex)}
        <span style={{ 'backgroundColor': 'yellow'}} className="mito-search-highlight">
            {highlightedCellData.slice(
                searchValueIndex,
                searchValueIndex + searchValue.length
            )}
        </span>
        {highlightedCellData.slice(searchValueIndex + searchValue.length)}
    </div>);
}

