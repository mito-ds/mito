// Copyright (c) Mito
// Distributed under the terms of the Modified BSD License.

import React, { useEffect } from 'react';
import DefaultTaskpane from '../DefaultTaskpane/DefaultTaskpane';
import MitoAPI from '../../../api';
import { GridState, SheetData, UIState } from '../../../types';
import Search from './Search';
import DefaultTaskpaneHeader from '../DefaultTaskpane/DefaultTaskpaneHeader';
import DefaultTaskpaneBody from '../DefaultTaskpane/DefaultTaskpaneBody';

interface SearchTaskpaneProps {
    sheetData: SheetData | undefined;
    gridState: GridState;
    setGridState: React.Dispatch<React.SetStateAction<GridState>>;
    mitoAPI: MitoAPI;
    mitoContainerRef: React.RefObject<HTMLDivElement>;
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
}

/*
    A taskpane that allows a user to search a value in the sheet
*/
const SearchTaskpane = (props: SearchTaskpaneProps): JSX.Element => {

    // When the Search Taskpane is closed, clear the search term
    useEffect(() => {
        return () => {
            props.setGridState(prevGridState => {
                return {
                    ...prevGridState,
                    searchString: ''
                }
            })
        }
    }, [])

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader
                header='Search Values in Sheet'
                setUIState={props.setUIState}
            />
            <DefaultTaskpaneBody>
                <Search
                    gridState={props.gridState}
                    sheetData={props.sheetData}
                    setGridState={props.setGridState}
                    mitoAPI={props.mitoAPI}
                    mitoContainerRef={props.mitoContainerRef}
                    uiState={props.uiState}
                />
            </DefaultTaskpaneBody>
        </DefaultTaskpane>     
    )
};

export default SearchTaskpane;