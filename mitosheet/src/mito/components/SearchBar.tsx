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
import { ensureCellVisible } from './endo/visibilityUtils';

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

    // Update the total number of matches when the search value changes
    useDebouncedEffect(() => {
        console.log(searchValue)
        // If the search value is empty, set the total matches to 0
        if (searchValue === undefined || searchValue === '') {
            setTotalMatches(0);
            return;
        }

        // Call the API to get the total number of matches and the displayed matches. 
        void mitoAPI.getTotalNumberMatches(uiState.selectedSheetIndex, searchValue ?? '').then((response) => {
            if ('error' in response) {
                return;
            }
            console.log('response', response)
            const total_number_matches = response.result.total_number_matches;
            const matches = response.result.matches;
            console.log('total_number_matches', total_number_matches)
            if (total_number_matches !== undefined && !isNaN(Number(total_number_matches))) {
                setTotalMatches(Number(total_number_matches));
            }
            if (matches !== undefined) {
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

    const totalMatchesDisplayed = matches?.length ?? 0;
    const matchesText = <span> {currentMatchIndex} of {totalMatches ?? <LoadingDots />} </span>;
    const finalText = totalMatches !== undefined && totalMatchesDisplayed === 0 ? <span>No results.</span> : matchesText

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            setUIState((prevUIState) => {
                let currentMatch = currentMatchIndex;
                // TODO: this isn't working
                if (e.shiftKey) {
                    if (currentMatch === 0) {
                        currentMatch = totalMatchesDisplayed - 1;
                    } else {
                        currentMatch = currentMatch - 1;
                    }
                } else {
                    if (currentMatch >= (totalMatchesDisplayed) - 1) {
                        currentMatch = 0;
                    } else {
                        currentMatch += 1;
                    }
                }
                if (currentMatch < totalMatchesDisplayed && matches !== undefined) {
                    ensureCellVisible(
                        containerDiv,
                        scrollAndRenderedContainerDiv,
                        sheetView,
                        gridState,
                        matches[currentMatch].row,
                        matches[currentMatch].col,
                    )
                }
                return {
                    ...prevUIState,
                    currOpenSearch: {
                        ...prevUIState.currOpenSearch,
                        currentMatchIndex: currentMatch
                    }
                }
            })
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUIState({
            ...uiState,
            currOpenSearch: {
                ...uiState.currOpenSearch,
                searchValue: e.target.value,
                currentMatchIndex: 0
            }
        })
        if (e.target.value === '') {
            setTotalMatches(0);
        } else {
            setTotalMatches(undefined);
        }
    }

    return (<div className='mito-search-bar'>
        <Input
            id='mito-search-bar-input'
            value={searchValue ?? ''}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className={classNames('mito-input')}
            placeholder='Find...'
            autoFocus
        />
        <span>{finalText}</span>
        <button
            className='mito-close-search-button'
            onClick={() => {
                setUIState({
                    ...uiState,
                    currOpenSearch: { isOpen: false, currentMatchIndex: 0 }
                })
            }}
        >
            <XIcon strokeWidth='1' width='15' height='15' />
        </button>
    </div>);
}