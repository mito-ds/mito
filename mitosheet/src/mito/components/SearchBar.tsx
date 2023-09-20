// Copyright (c) Mito

import React from 'react';
import { GridState, SheetView, UIState } from '../types';
import XIcon from './icons/XIcon';

import '../../../css/elements/SearchBar.css';
import { classNames } from '../utils/classNames';
import Input from './elements/Input';
import { MitoAPI } from '../api/api';
import { useDebouncedEffect } from '../hooks/useDebouncedEffect';
import LoadingDots from './elements/LoadingDots';
import { ensureCellVisible, scrollColumnIntoView } from './endo/visibilityUtils';
import SearchNavigateIcon from './icons/SearchNavigateIcon';
import CautionIcon from './icons/CautionIcon';

interface SearchBarProps {
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    uiState: UIState;
    mitoAPI: MitoAPI;
    containerDiv: HTMLDivElement | null;
    scrollAndRenderedContainerDiv: HTMLDivElement | null;
    sheetView: SheetView;
    gridState: GridState;
}

export const SearchBar: React.FC<SearchBarProps> = (props) => {
    const {
        setUIState,
        uiState,
        mitoAPI,
        containerDiv,
        scrollAndRenderedContainerDiv,
        sheetView,
        gridState
    } = props;
    const { searchValue, currentMatchIndex, matches } = uiState.currOpenSearch;
    const [totalMatches, setTotalMatches] = React.useState<number | undefined>(undefined);
    const [ showCautionMessage, setShowCautionMessage ] = React.useState<boolean>(false);

    const scrollMatchIntoView = (match?: { row: number; col: number }) => {
        // Columns have row index -1, so we check for that first.
        if (match?.row === -1) {
            scrollColumnIntoView(
                containerDiv,
                scrollAndRenderedContainerDiv,
                sheetView,
                gridState,
                match?.col
            )
        } else if (match !== undefined) {
            ensureCellVisible(
                containerDiv,
                scrollAndRenderedContainerDiv,
                sheetView,
                gridState,
                match.row,
                match.col,
            )
        }
    }

    // Call the backend to get the new match information when the search value or sheet index changes.
    useDebouncedEffect(() => {
        // If the search value is empty, set the total matches to 0 and don't call the API.
        if (searchValue === undefined || searchValue === '') {
            setTotalMatches(0);
            return;
        }

        // Call the API to get the total number of matches and the displayed matches. 
        void mitoAPI.getTotalNumberMatches(uiState.selectedSheetIndex, searchValue ?? '').then((response) => {
            if ('error' in response) {
                return;
            }
            const { total_number_matches, matches } = response.result;

            // Update the total matches. 
            if (total_number_matches !== undefined && !isNaN(Number(total_number_matches))) {
                setTotalMatches(Number(total_number_matches));
            }

            // Update the matches in UIState. This will trigger a re-render of the grid with
            // the matches highlighted.
            if (matches !== undefined) {
                scrollMatchIntoView(matches[currentMatchIndex]);
                setUIState((prevUIState) => {
                    return {
                        ...prevUIState,
                        currOpenSearch: {
                            ...prevUIState.currOpenSearch,
                            matches: matches
                        }
                    }
                });
            }
        });
    }, [searchValue, uiState.selectedSheetIndex], 500);

    // This is separate from totalMatches because we only display the first 1500 matches.
    const totalMatchesDisplayed: number = matches?.length ?? 0;

    // This displays a loading icon if the total matches is undefined.
    // Otherwise, it displays the current match index and the total number of matches.
    const matchesInfo = <span> {(totalMatches ?? 0) > 0 ? currentMatchIndex + 1 : 0} of {totalMatches ?? <LoadingDots />} </span>;

    // If there are no matches, display "No results." Otherwise, display the matches text.
    const finalMatchInfo =
        totalMatches !== undefined && totalMatchesDisplayed === 0
        ? <span>No results.</span>
        : matchesInfo;

    // This handles when the user clicks the up or down arrow to change the current match
    // or presses enter or shift+enter. 
    const handleCurrentMatchChange = (direction: 'next' | 'prev') => {
        setUIState((prevUIState) => {
            let currentMatch = currentMatchIndex;

            // Because we only display the first 1500 matches, we need to check if there are some matches not displayed
            const someMatchesNotDisplayed = (totalMatches ?? totalMatchesDisplayed) > totalMatchesDisplayed;

            // First, we calculate the new current match index and show the caution message if necessary
            if (direction === 'prev') {
                const isFirstMatch = currentMatch === 0;
                // Show the caution message if we are on the first match and there are some matches not displayed
                setShowCautionMessage(isFirstMatch && someMatchesNotDisplayed);
                
                // Update the current match to loop around if we are on the first match
                currentMatch = isFirstMatch ? totalMatchesDisplayed - 1 : currentMatch - 1;
            } else {
                // If we're on the last displayed match, loop back to the beginning
                const isLastMatch = currentMatch >= (totalMatchesDisplayed) - 1;

                // Show the caution message if we are on the last match and there are some matches not displayed
                setShowCautionMessage(isLastMatch && someMatchesNotDisplayed);

                // Update the current match to loop around if we are on the last match
                currentMatch = isLastMatch ? 0 : currentMatch + 1;
            }

            // Then, we scroll the cell / column into view.
            scrollMatchIntoView(matches?.[currentMatch])

            // Finally, we update the current match index in UIState.
            return {
                ...prevUIState,
                currOpenSearch: {
                    ...prevUIState.currOpenSearch,
                    currentMatchIndex: currentMatch
                }
            }
        })
    }

    // This handles when the user types in the search bar. 
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Update the search value in UIState. Also, resets the current
        // match index to 0 and the matches to undefined so that the former
        // search results are not displayed.
        setUIState({
            ...uiState,
            currOpenSearch: {
                ...uiState.currOpenSearch,
                searchValue: e.target.value,
                currentMatchIndex: 0,
                matches: e.target.value === '' ? undefined : uiState.currOpenSearch.matches
            }
        })

        // Reset other state variables. 
        setShowCautionMessage(false);
        setTotalMatches(e.target.value === '' ? 0 : undefined);
    }

    return (<div className='mito-search-bar'>
        <Input
            id='mito-search-bar-input'
            value={searchValue ?? ''}
            onChange={handleChange}
            onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    handleCurrentMatchChange('next');
                }
            }}
            onKeyUp={(e: React.KeyboardEvent) => {
                // onKeyDown can't detect shift+enter, so we use onKeyUp to detect it
                if (e.key === 'Enter' && e.shiftKey) {
                    handleCurrentMatchChange('prev');
                }
            }}
            className={classNames('mito-input')}
            placeholder='Find...'
            autoFocus
        />
        <span>{finalMatchInfo}</span>
        <button
            className='mito-search-button'
            onClick={() => {
                handleCurrentMatchChange('prev')
            }}
        >
            <SearchNavigateIcon upOrDown='up' strokeColor='var(--mito-text)' strokeWidth={1} />
        </button>
        <button
            className='mito-search-button'
            onClick={() => {
                handleCurrentMatchChange('next')
            }}
        >
            <SearchNavigateIcon upOrDown='down' strokeColor='var(--mito-text)' strokeWidth={1} />   
        </button>
        <button
            className='mito-search-button'
            onClick={() => {
                setUIState({
                    ...uiState,
                    currOpenSearch: { isOpen: false, currentMatchIndex: 0 }
                })
            }}
        >
            <XIcon strokeWidth='1' width='15' height='15' />
        </button>
        {showCautionMessage && <div className='mito-search-caution'>
            <CautionIcon />
            <span>Only the first 1500 rows are displayed.</span>
        </div>}
    </div>);
}