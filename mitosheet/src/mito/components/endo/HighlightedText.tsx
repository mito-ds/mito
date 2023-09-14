import React from 'react';

interface HighlightedMatchProps {
    text: string;
    searchValue?: string;
}

export const HighlightedText: React.FC<HighlightedMatchProps> = (props) => {
    const { searchValue, text } = props;
    if (searchValue === undefined) {
        return <div>{text}</div>;
    }

    const searchValueIndex = text.toLowerCase().indexOf(searchValue.toLowerCase());
    let highlightedText = text;
    if (searchValueIndex === -1) {
        return <div>{text}</div>;
    }
    return (<div>
        {highlightedText.slice(0, searchValueIndex)}
        <span style={{ 'backgroundColor': 'yellow'}} className="mito-search-highlight">
            {highlightedText.slice(
                searchValueIndex,
                searchValueIndex + searchValue.length
            )}
        </span>
        {highlightedText.slice(searchValueIndex + searchValue.length)}
    </div>);
}

