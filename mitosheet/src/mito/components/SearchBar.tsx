// Copyright (c) Mito

import React from 'react';
import { UIState } from '../types';
import XIcon from './icons/XIcon';

import '../../../css/elements/SearchBar.css';
import { classNames } from '../utils/classNames';
import Input from './elements/Input';
import { MitoAPI } from '../api/api';

interface SearchBarProps {
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    uiState: UIState;
    mitoAPI: MitoAPI;
}

export const SearchBar: React.FC<SearchBarProps> = (props) => {
    const { setUIState, uiState, mitoAPI } = props;
    const [totalMatches, setTotalMatches] = React.useState<number | undefined>(undefined);
    const searchValue = uiState.currOpenSearch.searchValue;

    /**
     * Update the total number of matches when the search value changes
     */
    React.useEffect(() => {
        // If the search value is empty, set the total matches to 0
        if (searchValue === undefined || searchValue === '') {
            setTotalMatches(0);
            return;
        }
        void mitoAPI.getTotalNumberMatches(uiState.selectedSheetIndex, searchValue ?? '').then((response) => {
            if ('error' in response) {
                return;
            }
            const total = response.result;
            if (total !== undefined && !isNaN(Number(total))) {
                setTotalMatches(Number(total));
            }
        });
    }, [searchValue, uiState.selectedSheetIndex]);

    return (<div className='mito-search-bar'>
        <Input
            id='mito-search-bar-input'
            value={searchValue ?? ''}
            onChange={(e) => {
                setUIState({
                    ...uiState,
                    currOpenSearch: {
                        ...uiState.currOpenSearch,
                        searchValue: e.target.value
                    }
                })
            }}
            className={classNames('mito-input')}
            placeholder='Find...'
            autoFocus
        />
        <span>{totalMatches ?? '...'} match{totalMatches === 1 ? '' : 'es'}</span>
        <button
            className='mito-close-search-button'
            onClick={() => {
                setUIState({
                    ...uiState,
                    currOpenSearch: { isOpen: false }
                })
            }}
        >
            <XIcon strokeWidth='1' width='15' height='15' />
        </button>
    </div>);
}