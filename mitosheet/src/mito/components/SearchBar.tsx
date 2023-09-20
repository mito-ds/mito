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

    // Update the total number of matches when the search value changes
    useDebouncedEffect(() => {
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
            const total_number_matches = response.result.total_number_matches;
            const matches = response.result.matches;
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

    const totalMatchesDisplayed: number = matches?.length ?? 0;
    const matchesText = <span> {totalMatches ?? 0 > 0 ? currentMatchIndex + 1 : 0} of {totalMatches ?? <LoadingDots />} </span>;
    const finalText = totalMatches !== undefined && totalMatchesDisplayed === 0 ? <span>No results.</span> : matchesText

    const handleCurrentMatchChange = (direction: 'next' | 'prev') => {
        setUIState((prevUIState) => {
            let currentMatch = currentMatchIndex;
            if (direction === 'prev') {
                if (currentMatch === 0) {
                    currentMatch = totalMatchesDisplayed - 1;
                    setShowCautionMessage((totalMatches ?? totalMatchesDisplayed) > totalMatchesDisplayed);
                } else {
                    currentMatch = currentMatch - 1;
                    setShowCautionMessage(false);
                }
            } else {
                if (currentMatch >= (totalMatchesDisplayed) - 1) {
                    currentMatch = 0;
                    setShowCautionMessage((totalMatches ?? totalMatchesDisplayed) > totalMatchesDisplayed);
                } else {
                    currentMatch += 1;
                    setShowCautionMessage(false);
                }
            }
            if (currentMatch < totalMatchesDisplayed && matches !== undefined) {
                console.log(matches[currentMatch])
                if (matches[currentMatch].row === -1) {
                    scrollColumnIntoView(
                        containerDiv,
                        scrollAndRenderedContainerDiv,
                        sheetView,
                        gridState,
                        matches[currentMatch].col
                    )
                } else {
                    ensureCellVisible(
                        containerDiv,
                        scrollAndRenderedContainerDiv,
                        sheetView,
                        gridState,
                        matches[currentMatch].row,
                        matches[currentMatch].col,
                    )
                }
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

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            handleCurrentMatchChange('next');
        }
    }

    // onKeyDown doesn't allow for shift + enter, so we use onKeyUp
    const handleKeyUp = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && e.shiftKey) {
            handleCurrentMatchChange('prev');
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUIState({
            ...uiState,
            currOpenSearch: {
                ...uiState.currOpenSearch,
                searchValue: e.target.value,
                currentMatchIndex: 0,
                matches: e.target.value === '' ? undefined : uiState.currOpenSearch.matches
            }
        })
        setShowCautionMessage(false);
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
            onKeyUp={handleKeyUp}
            className={classNames('mito-input')}
            placeholder='Find...'
            autoFocus
        />
        <span>{finalText}</span>
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