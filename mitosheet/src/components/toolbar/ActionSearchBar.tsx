// Copyright (c) Mito

import React, { useEffect, useState } from 'react';
import MitoAPI from '../../api';
import { useDebouncedEffect } from '../../hooks/useDebouncedEffect';
import { Action, ActionEnum, GridState } from '../../types';
import { getSortedActionsToDisplay } from '../../utils/actions';
import Dropdown, { DROPDOWN_IGNORE_CLICK_CLASS, handleKeyboardInDropdown } from '../elements/Dropdown';
import DropdownItem from '../elements/DropdownItem';
import Input from '../elements/Input';
import { focusGrid } from '../endo/focusUtils';

/* 
    A search bar that allows users to search for actions
    in the tool, and either click on it/press enter if they 
    want to perform this action in the sheet.

    The only way to open the Action search bar dropdown is by clicking 
    on the action search bar. 

    The only ways to close the action search bar dropdown is by 
        1.  select a non-disabled action - this is handled via the useCallOnAnyClick effect which gets triggered
            because either the user clicked on a dropdownItem or the user pressed Enter on a dropdownItem and the onEnter
            function calls .click()
        2. click outside of the dropdown and search bar - this is handled via the useCallOnAnyClick effect
        3. press escape - this is handled via handleKeyboardInDropdown 
*/
const ActionSearchBar = (props: {
    actions: Record<ActionEnum, Action>;
    mitoAPI: MitoAPI;
    mitoContainerRef: React.RefObject<HTMLDivElement>;
    gridState: GridState;
    setGridState: React.Dispatch<React.SetStateAction<GridState>>;
}): JSX.Element => {

    const searchString = props.gridState.searchString
    const [displayDropdown, setDisplayDropdown] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1);

    // When the search updates, reset the selected index back to -1
    useEffect(() => {
        setSelectedIndex(-1)
    }, [searchString])

    useDebouncedEffect(() => {
        // Log that the userSearchTerm is being updated
        if (searchString !== '') {
            void props.mitoAPI.sendLogMessage('searched_action_search_bar', {
                user_serch_term: searchString
            });
        }
    }, [searchString], 150)

    /* 
        A helper function to close the dropdown, and refocus on
        the grid
    */
    const closeDropdownAndClearSearchAndFocusOnGrid = () => {
        setDisplayDropdown(false);

        const endoGridContainer = props.mitoContainerRef.current?.querySelector('.endo-grid-container') as HTMLDivElement | null | undefined;
        focusGrid(endoGridContainer);

        // We add a short delay before reseting the searchTerm to let
        // the dropdown close before changing the displayed actions. 
        setTimeout(() => {
            props.setGridState(gridState => {
                return {
                    ...gridState,
                    searchString: ''
                }
            })
        }, 200)
    }

    const sortedDisplayedActions = getSortedActionsToDisplay(searchString, props.actions)

    // Make sure the selectedIndex is still the index of a displayed action
    if (selectedIndex > sortedDisplayedActions.length - 1) {
        setSelectedIndex(sortedDisplayedActions.length - 1)
    }

    return (
        <>
            <Input
                id='action-search-bar-id' // NOTE: this ID is used for selection when command f is pressed
                className={DROPDOWN_IGNORE_CLICK_CLASS} // Make sure this doesn't close dropdowns if it's clicked on
                value={searchString}
                placeholder='Search Functionality'
                onChange={(e) => {
                    const newSearch = e.target.value;
                    props.setGridState(gridState => {
                        return {
                            ...gridState,
                            searchString: newSearch
                        }
                    })
                }}
                onFocus={() => {
                    setDisplayDropdown(true)
                }}
                onKeyDown={(e) => {
                    e.persist()
                    handleKeyboardInDropdown(
                        e, 
                        sortedDisplayedActions.length, 
                        setSelectedIndex, 
                        () => closeDropdownAndClearSearchAndFocusOnGrid()
                    )
                }}
                width='block'
                type='text'
            />
            {displayDropdown && 
                <Dropdown 
                    key={selectedIndex}
                    closeDropdown={() => {
                        setDisplayDropdown(false)
                    }}
                    selectedIndexState={{selectedIndex: selectedIndex, setSelectedIndex: setSelectedIndex}}
                >
                    {sortedDisplayedActions.map((action, idx) => {
                        return (
                            <DropdownItem 
                                key={action.shortTitle}
                                title={action.longTitle !== undefined ? action.longTitle : action.shortTitle}
                                subtext={action.isDisabled() !== undefined ? action.isDisabled() : action.tooltip}
                                hideSubtext={idx !== selectedIndex}
                                displaySubtextOnHover={true}
                                disabled={action.isDisabled() !== undefined}
                                onClick={() => {
                                    // Log that the action was selected
                                    void props.mitoAPI.sendLogMessage('selected_action_from_action_search_bar', {
                                        action: action.type,
                                        user_serch_term: searchString 
                                    });

                                    action.actionFunction(); 

                                    closeDropdownAndClearSearchAndFocusOnGrid()
                                }}
                            />
                        )   
                    })}
                </Dropdown>
            }
        </>
    );
};

export default ActionSearchBar