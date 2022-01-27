import React, { useEffect, useRef, useState } from 'react';
import MitoAPI from '../../../api';
import { useDebouncedEffect } from '../../../hooks/useDebouncedEffect';
import { GridState, SearchMatches, SheetData, UIState } from '../../../types';
import Input from '../../elements/Input';
import { focusGrid } from '../../endo/focusUtils';
import { calculateCurrentSheetView } from '../../endo/sheetViewUtils';
import { ensureCellVisible } from '../../endo/visibilityUtils';
import SearchNavigateIcon from '../../icons/SearchNavigateIcon';

const EMPTY_SEARCH_MATCHES = {
    columnHeaderIndexes: [],
    cellIndexes: []
}

/* 
    A search component at the bottom of the sheet
    that allows for a case-insensitive partial-match
    search of the current sheet, in both headers
    and the cells.
*/
const Search = (props: {
    gridState: GridState;
    sheetData: SheetData | undefined;
    setGridState: React.Dispatch<React.SetStateAction<GridState>>;
    mitoAPI: MitoAPI;
    mitoContainerRef: React.RefObject<HTMLDivElement>;
    uiState: UIState;
}): JSX.Element => {

    const [loading, setLoading] = useState(false);
    const [searchMatches, setSearchMatches] = useState<SearchMatches>(EMPTY_SEARCH_MATCHES);
    /* 
        We have a list of matches, and we need to remember which item we are
        selected on in this list. 

        To start, the user has no selected any of the items, so we set the index
        to 0. We always display the index to the user as matchIndex + 1.
    */
    const [matchIndex, setMatchIndex] = useState(-1);

    /* 
        We load search matches in a paginated fashion, so that loading
        them does not slow down and ultimately crash the entire sheet. We
        load these in sections of rows.

        Because this may take a while to run, we need to make sure that if
        the user changes the search term / sheet while it is still running, we cancel
        the rest of the paginated results.

        To do this, we store a ref of the current search params, and update it
        when we start searching. Then, before each paginated api call, we
        check this ref, and stop the loop if it is not what we expect.
    */
    const searchParamsRef = useRef([0, '']);
    const loadSearchMatches = async (searchString: string, sheetIndex: number): Promise<void> => {
        // Save this new search
        searchParamsRef.current = [sheetIndex, searchString];
        setSearchMatches(EMPTY_SEARCH_MATCHES)
        setMatchIndex(-1);
        
        if (searchString !== '') {

            // This is where we go and actually get the data
            for (let startingRowIndex = 0; startingRowIndex < (props.sheetData?.numRows || 0) + 2000; startingRowIndex += 2000) {
                // Otherwise, keep loading matches
                const matches = await props.mitoAPI.getSearchMatches(sheetIndex, searchString, startingRowIndex);

                /* 
                    If another, newer search is going on, break out of this loop, and stop loading things.
                    We also want to break out of this search if the taskpane is closed, but I can't figure out how to. 
                    When this component unmounts, the state variables that it relies on are set -- I can't update them.
                    See an explanation here: https://stackoverflow.com/questions/70283865/stop-my-react-for-loop-from-executing-when-component-umounts
                */
                if (searchParamsRef.current[0] !== sheetIndex || searchParamsRef.current[1] !== searchString) {
                    return;
                }

                if (matches !== undefined) {
                    setSearchMatches(oldMatches => {
                        // NOTE: we use a slice here rather than spread syntax for reasons described in the first
                        // answer here: https://stackoverflow.com/questions/52948823/rangerror-too-many-arguments-provided-for-a-function-call
                        // namely, there is a max # of elements you can use the .slice syntax with 
                        const cellIndexes = oldMatches.cellIndexes.slice();
                        cellIndexes.push(...matches.cellIndexes);
                        return {
                            columnHeaderIndexes: matches.columnHeaderIndexes,
                            cellIndexes: cellIndexes
                        }
                    });
                }
            }

            // Log that we searched
            void props.mitoAPI.sendLogMessage('search');
        } 

        setLoading(false);
    }

    useDebouncedEffect(() => {
        void loadSearchMatches(props.gridState.searchString, props.uiState.selectedSheetIndex);
    }, [props.gridState.searchString, props.uiState.selectedSheetIndex, props.sheetData], 250)

    // Mark this as loading when it's loading
    const isFirstTime = useRef(true);
    useEffect(() => {
        // Make sure we don't set loading to true on the first render
        if (!isFirstTime.current) {
            setLoading(true);
        }
        isFirstTime.current = false;
    }, [props.gridState.searchString])


    // For the same reason above, we use the slice because the cellIndexes might have
    // eitherre than 100k matches, in which case spread syntax can cause issues
    const allMatches = searchMatches.cellIndexes.slice()
    allMatches.unshift(...searchMatches.columnHeaderIndexes); // Put the column headers at the start of the array
    const numMatches = searchMatches.columnHeaderIndexes.length + searchMatches.cellIndexes.length;
    const adjustedIndex = numMatches > 0 ? (matchIndex + 1) % allMatches.length : 0;
    const match = allMatches[adjustedIndex];

    /* 
        Moves the sheet to the current match, and also either increments or decrements
        the current index for the next move
    */
    const moveToMatch = (increment: boolean) => {

        if (numMatches === 0) {
            return;
        }

        const containerDiv = props.mitoContainerRef.current?.querySelector('.endo-grid-container') as HTMLDivElement | null | undefined;
        const scrollAndRenderedContainerDiv = props.mitoContainerRef.current?.querySelector('.endo-scroller-and-renderer-container') as HTMLDivElement | null | undefined;

        if (containerDiv === undefined || scrollAndRenderedContainerDiv === undefined) {
            return;
        }

        // Select this cell
        props.setGridState(prevGridState => {
            return {
                ...prevGridState,
                selections: [{
                    startingRowIndex: match.rowIndex,
                    endingRowIndex: match.rowIndex,
                    startingColumnIndex: match.columnIndex,
                    endingColumnIndex: match.columnIndex,
                }]
            }
        })

        // And ensure it's visible
        ensureCellVisible(
            containerDiv, scrollAndRenderedContainerDiv,
            calculateCurrentSheetView(props.gridState), props.gridState,
            match.rowIndex, match.columnIndex
        );

        setMatchIndex(oldIndex => {
            if (increment) {
                return (oldIndex + 1) % allMatches.length
            } else {
                if (oldIndex > 0) {
                    return oldIndex - 1;
                }
                return allMatches.length - 1;
            }
        });

        void props.mitoAPI.sendLogMessage('search_move_to_match', {
            increment: increment,
            is_column_header: match.rowIndex === -1
        });
    }

    const rightText = props.gridState.searchString !== '' 
        ? `${matchIndex + 1} of ${numMatches}${loading ? '...' : ''}`
        : undefined

    return (
        <div className='search-container'>
            <Input
                placeholder='Search'
                value={props.gridState.searchString}
                rightText={rightText}
                width='large'
                onChange={(e) => {
                    const value = e.target.value;
                    props.setGridState(gridState => {
                        return {
                            ...gridState,
                            searchString: value
                        }
                    })
                }}
                onKeyDown={(e) => {

                    if (e.key === 'Enter') {
                        e.stopPropagation();
                        e.preventDefault();
                        if (e.shiftKey) {
                            // TODO: for some reason, this is never detected! It's driving me mad...
                            moveToMatch(false)
                        } else {
                            moveToMatch(true);
                        }
                    } else if (e.key === 'Escape') {
                        // If the user presses escape, focus back on the grid
                        const containerDiv = props.mitoContainerRef.current?.querySelector('.endo-grid-container') as HTMLDivElement | null | undefined;
                        if (containerDiv) {
                            focusGrid(containerDiv);
                        }
                    }
                }}
                autoFocus
            />
            <div className='search-navigation-icons-container'>
                <div className='search-navigation-icons'>
                    <div className='pl-10px' onClick={() => {moveToMatch(false)}}>
                        <SearchNavigateIcon upOrDown='up' disabled={numMatches === 0}/>
                    </div>
                    <div className='pl-10px pr-10px' onClick={() => {moveToMatch(true)}}>
                        <SearchNavigateIcon upOrDown='down' disabled={numMatches === 0}/>
                    </div>
                </div>
            </div>
        </div>
    )
}



export default Search;