/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */


import React from 'react';
import { GridState, SheetData, SheetView, UIState } from '../types';
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
import ExpandCollapseIcon from './icons/ExpandCollapseIcon';
import { getSelectedColumnIDsWithEntireSelectedColumn } from './endo/selectionUtils';

interface SearchBarProps {
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    uiState: UIState;
    mitoAPI: MitoAPI;
    containerDiv: HTMLDivElement | null;
    scrollAndRenderedContainerDiv: HTMLDivElement | null;
    sheetView: SheetView;
    gridState: GridState;
    setGridState: React.Dispatch<React.SetStateAction<GridState>>;
    sheetData: SheetData;
}

export const SearchBar: React.FC<SearchBarProps> = (props) => {
    const {
        setUIState,
        uiState,
        mitoAPI,
        containerDiv,
        scrollAndRenderedContainerDiv,
        sheetView,
        gridState,
        setGridState,
        sheetData
    } = props;
    const { searchValue, currentMatchIndex, matches } = uiState.currOpenSearch;

    // totalMatches is undefined when we're making the API call to get the total number of matches.
    const [ totalMatches, setTotalMatches ] = React.useState<number | undefined>(undefined);
    const [ showCautionMessage, setShowCautionMessage ] = React.useState<boolean>(false);
    const [ replaceValue, setReplaceValue ] = React.useState<string>('');

    const scrollMatchIntoViewAndUpdateSelection = (match?: { rowIndex: number; colIndex: number }) => {
        // Columns have row index -1, so we check for that first.
        if (match?.rowIndex === -1) {
            scrollColumnIntoView(
                containerDiv,
                scrollAndRenderedContainerDiv,
                sheetView,
                gridState,
                match?.colIndex
            )
        } else if (match !== undefined) {
            ensureCellVisible(
                containerDiv,
                scrollAndRenderedContainerDiv,
                sheetView,
                gridState,
                match.rowIndex,
                match.colIndex,
            )
        }

        // Either way, update the selection in the grid state.
        if (match !== undefined) {
            setGridState((prevGridState) => {
                return {
                    ...prevGridState,
                    selections: [{
                        startingColumnIndex: match.colIndex,
                        endingColumnIndex: match.colIndex,
                        startingRowIndex: match.rowIndex,
                        endingRowIndex: match.rowIndex,
                        sheetIndex: uiState.selectedSheetIndex,
                    }]
                }
            });
        }
    }

    const getMatches = () => {
        // If the search value is empty, set the total matches to 0 and don't call the API.
        if (searchValue === undefined || searchValue === '') {
            setTotalMatches(0);
            return;
        }

        // Call the API to get the total number of matches and the displayed matches. 
        void mitoAPI.getSearchMatches(uiState.selectedSheetIndex, searchValue ?? '').then((response) => {
            if ('error' in response) {
                return;
            }
            const new_total_number_matches = response.result.total_number_matches;
            const new_matches = response.result.matches;
            // Update the total matches. 
            setTotalMatches(new_total_number_matches ?? 0);

            // Update the matches in UIState. This will trigger a re-render of the grid with
            // the matches highlighted.
            setUIState((prevUIState) => {
                return {
                    ...prevUIState,
                    currOpenSearch: {
                        ...prevUIState.currOpenSearch,
                        matches: new_matches ?? []
                    }
                }
            });
        });
    }

    // Call the backend to get the new match information when the search value or sheet index changes.
    useDebouncedEffect(getMatches, [searchValue, uiState.selectedSheetIndex], 500);

    // This is separate from totalMatches because we only display the first 1500 rows.
    const totalMatchesDisplayed: number = matches?.length ?? 0;

    // This displays a loading icon if the total matches is undefined.
    // Otherwise, it displays the current match index and the total number of matches.
    const matchesInfo = <span> {(totalMatches ?? 0) > 0 ? Math.max(currentMatchIndex + 1, 0) : 0} of {totalMatches ?? <LoadingDots />} </span>;

    // If there are no matches, display "No results." Otherwise, display the matches text.
    const finalMatchInfo =
        totalMatches === 0
            ? <span>No results.</span>
            : matchesInfo;

    // This handles when the user clicks the up or down arrow to change the current match
    // or presses enter or shift+enter. 
    const handleCurrentMatchChange = (direction: 'next' | 'prev') => {
        setUIState((prevUIState) => {
            let currentMatch = currentMatchIndex;

            // Because we only display the first 1500 rows, we need to check if there are some matches not displayed
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
            const newMatch = matches?.[currentMatch];
            scrollMatchIntoViewAndUpdateSelection(newMatch);

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
        // match index to -1 and the matches to undefined so that the former
        // search results are not displayed.
        setUIState({
            ...uiState,
            currOpenSearch: {
                ...uiState.currOpenSearch,
                searchValue: e.target.value,
                currentMatchIndex: -1,
                matches: e.target.value === '' ? [] : uiState.currOpenSearch.matches
            }
        })

        // Reset other state variables. 
        setShowCautionMessage(false);
        setTotalMatches(e.target.value === '' ? 0 : undefined);
    }

    const handleReplace = (onlySelectedColumns?: boolean) => {
        void mitoAPI.editReplace(
            uiState.selectedSheetIndex,
            searchValue ?? '',
            replaceValue ?? '',
            onlySelectedColumns ?
                getSelectedColumnIDsWithEntireSelectedColumn(gridState.selections, sheetData):
                []
        ).then(() => {
            getMatches();
        });
    }

    return (<div className='mito-search-bar' style={{ top: uiState.currentToolbarTab !== undefined ? '117px': '57px'}}>
        <button
            onClick={() => {
                setUIState(prevUiState => {
                    return {
                        ...prevUiState,
                        currOpenSearch: {
                            ...prevUiState.currOpenSearch,
                            isExpanded: !uiState.currOpenSearch.isExpanded
                        }
                    }
                });
            }}
            className='mito-search-button'
        >
            <ExpandCollapseIcon action={uiState.currOpenSearch.isExpanded ? 'collapse' : 'expand'} strokeColor='var(--mito-text)' strokeWidth={1}/>
        </button>
        <div className='mito-search-bar-content'>
            <div className='mito-search-bar-search'>
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
                <span style={{ whiteSpace: 'nowrap' }}>{finalMatchInfo}</span>
                {/* This button jumps to the previous match */}
                <button
                    className='mito-search-button'
                    onClick={() => {
                        handleCurrentMatchChange('prev')
                    }}
                >
                    <SearchNavigateIcon width='17' height='15' direction='up' strokeColor='var(--mito-text)' strokeWidth={1} />
                </button>
                {/* This button jumps to the next match */}
                <button
                    className='mito-search-button'
                    onClick={() => {
                        handleCurrentMatchChange('next')
                    }}
                >
                    <SearchNavigateIcon width='17' height='15' direction='down' strokeColor='var(--mito-text)' strokeWidth={1} />   
                </button>
                {/* This button closes the search bar. */}
                <button
                    className='mito-search-button'
                    onClick={() => {
                        setUIState({
                            ...uiState,
                            currOpenSearch: { isOpen: false, currentMatchIndex: 0, matches: [] }
                        })
                    }}
                >
                    <XIcon strokeWidth='1' width='15' height='15' />
                </button>
            </div>
            {uiState.currOpenSearch.isExpanded && <div className='mito-search-bar-replace'>
                <Input
                    value={replaceValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setReplaceValue(e.target.value);
                    }}
                    onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.key === 'Enter') {
                            handleReplace();
                        }
                    }}
                    className='mito-input'
                    placeholder='Replace...'
                    autoFocus={searchValue !== undefined && searchValue !== ''}
                />
                <button className='mito-search-button' onClick={() => {
                    handleReplace()
                }}>
                    Replace All
                </button>
                <button className='mito-search-button' disabled={getSelectedColumnIDsWithEntireSelectedColumn(gridState.selections, sheetData).length === 0} onClick={() => {
                    handleReplace(true);
                }}>
                    Replace in Selected Columns
                </button>
            </div>}
        </div>
        {showCautionMessage && <div style={{top: uiState.currOpenSearch.isExpanded ? '71px' : '40px'}} className='mito-search-caution'>
            <CautionIcon />
            <span>Only the first 1500 rows are displayed.</span>
        </div>}
    </div>);
}