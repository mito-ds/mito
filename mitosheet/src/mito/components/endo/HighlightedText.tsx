import React from 'react';

interface HighlightedMatchProps {
    text: string;
    searchValue?: string;
}

export const HighlightedText: React.FC<HighlightedMatchProps> = (props) => {
    const { searchValue, text } = props;
    if (searchValue === undefined || searchValue === '') {
        return <div>{text}</div>;
    }

    let searchValueIndex = text.toLowerCase().indexOf(searchValue.toLowerCase());
    if (searchValueIndex === -1) {
        return <div>{text}</div>;
    }
    let unhighlightedText = text;
    const highlightedText = [];
    while (searchValueIndex > -1) {
        highlightedText.push(unhighlightedText.slice(0, searchValueIndex))
        highlightedText.push(
            <span style={{ 'backgroundColor': 'yellow'}} className="mito-search-highlight">
                {unhighlightedText.slice(
                    searchValueIndex,
                    searchValueIndex + searchValue.length
                )}
            </span>
        )
        unhighlightedText = unhighlightedText.slice(searchValueIndex + searchValue.length);
        searchValueIndex = unhighlightedText.toLowerCase().indexOf(searchValue.toLowerCase());
    }
    highlightedText.push(unhighlightedText);
    return (<div>
        {highlightedText}
    </div>);
}

