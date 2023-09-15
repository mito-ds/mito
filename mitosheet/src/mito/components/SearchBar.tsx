// Copyright (c) Mito

import React from 'react';
import { UIState } from '../types';
import XIcon from './icons/XIcon';

import '../../../css/elements/SearchBar.css';
import { classNames } from '../utils/classNames';
import Input from './elements/Input';

interface SearchBarProps {
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    uiState: UIState;
}

export const SearchBar: React.FC<SearchBarProps> = (props) => {
    return (<div className='mito-search-bar'>
        <Input
            id='mito-search-bar-input'
            value={props.uiState.currOpenSearch.searchValue ?? ''}
            onChange={(e) => {
                props.setUIState({
                    ...props.uiState,
                    currOpenSearch: {
                        ...props.uiState.currOpenSearch,
                        searchValue: e.target.value
                    }
                })
            }}
            className={classNames('mito-input')}
            placeholder='Find...'
            autoFocus
        />
        <button
            className='mito-close-search-button'
            onClick={() => {
                props.setUIState({
                    ...props.uiState,
                    currOpenSearch: { isOpen: false }
                })
            }}
        >
            <XIcon strokeWidth='1' width='15' height='15' />
        </button>
    </div>);
}