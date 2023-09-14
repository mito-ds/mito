// Copyright (c) Mito

import React from 'react';
import { UIState } from '../types';
import XIcon from './icons/XIcon';

interface SearchBarProps {
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    uiState: UIState;
}

export const SearchBar: React.FC<SearchBarProps> = (props) => {
    return (<div
        style={{
            'position': 'absolute',
            'top': '72px',
            'right': '0',
            'backgroundColor': 'var(--mito-background-highlight)',
            'borderLeft': '3px solid var(--mito-light-gray)',
            'boxShadow': '1px 4px 6px var(--mito-light-gray)',
            'padding': '5px',
            'display': 'flex',
        }}
    >
        <input
            onChange={(e) => {
                props.setUIState({
                    ...props.uiState,
                    currOpenSearch: {
                        ...props.uiState.currOpenSearch,
                        searchValue: e.target.value
                    }
                })
            }}
            placeholder='Find...'
            style={{
                'border': 'none',
                'width': '200px',
                'padding': '0.4em'
            }}
        />
        <button style={{ 'border': 'none', 'background': 'none', 'display': 'flex', 'alignItems': 'center', 'padding': '0 0 0 5px'}} onClick={() => {
            props.setUIState({
                ...props.uiState,
                currOpenSearch: { isOpen: false }
            })
        }}><XIcon/></button>
    </div>);
}