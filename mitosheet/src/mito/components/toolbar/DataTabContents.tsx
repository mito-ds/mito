/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito


import React from 'react'

import { ActionEnum, RunTimeAction, UIState } from '../../types';
import { Actions } from '../../utils/actions';
import ToolbarButton from './ToolbarButton';
import Dropdown from '../elements/Dropdown';
import DropdownItem from '../elements/DropdownItem';
import ImportIcon from '../icons/ImportIcon';
import { toTitleCase } from '../../utils/strings';


/**
 * This function returns a list of toolbar buttons for all the user defined imports:
 * 1. Any action with no domain gets its own button
 * 2. Any domain with a single action gets its own button
 * 3. Any domain with multiple actions gets a dropdown
 */
const getToolbarButtonsForUserDefinedImports = (
    actions: Actions,
    uiState: UIState,
    setUIState: React.Dispatch<React.SetStateAction<UIState>>
): JSX.Element[] => {
    // We create a mapping from domain to action
    const noDomainActions = actions.runtimeImportActionsList.filter(action => (action.domain === undefined || action.domain === null));
    const domainToAction = new Map<string, RunTimeAction[]>();
    actions.runtimeImportActionsList.forEach(action => {
        if (action.domain === undefined || action.domain === null) {
            return;
        }
        const domainActions = domainToAction.get(action.domain);
        if (domainActions === undefined) {
            domainToAction.set(action.domain, [action]);
        } else {
            domainActions.push(action);
        }
    });

    // For all the actions with no domain, or domains with a single action, we just return a button
    // While we return a dropdown for domains with multiple actions
    const soloButtons: JSX.Element[] = [];
    const dropdownButtons: JSX.Element[] = [];
    noDomainActions.forEach(action => {
        soloButtons.push(<ToolbarButton
            action={action}
            iconOverride={<ImportIcon />}
            key={action.staticType}
        />);
    });

    domainToAction.forEach((domainActions, domain) => {
        if (domainActions.length === 1) {
            soloButtons.push(<ToolbarButton
                action={domainActions[0]}
                iconOverride={<ImportIcon />}
                key={domainActions[0].staticType}
            />);
            return;
        }

        // Otherwise, we create a temporary action that opens this dropdown,
        // as we need it for the toolbar button. That's a bit of a hack, but it's
        // well contained to just this function
        const key = `open-domain-dropdown-${domainActions[0].domain}`;
        const openDomainAction: RunTimeAction = {
            staticType: key,
            titleToolbar: toTitleCase(domain),
            domain: domain,
            actionFunction: () => {
                setUIState(prevUIState => {
                    if (prevUIState.currOpenDropdown === undefined) {
                        return {
                            ...prevUIState,
                            currOpenDropdown: {
                                type: 'import-domain-dropdown',
                                domain: domain
                            }
                        };
                    }
                    return prevUIState;
                });
            },
            type: 'run-time',
            longTitle: key,
            searchTerms: [],
            isDisabled: () => undefined,
            tooltip: ''
        };

        dropdownButtons.push(<ToolbarButton
            action={openDomainAction}
            iconOverride={<ImportIcon />}
            key={domainActions[0].staticType}
        >
            <Dropdown
                display={typeof uiState.currOpenDropdown === 'object' && uiState.currOpenDropdown.type === 'import-domain-dropdown' && uiState.currOpenDropdown.domain === domain}
                closeDropdown={() => 
                    setUIState(prevUIState => {
                        if (typeof prevUIState.currOpenDropdown !== 'object' || prevUIState.currOpenDropdown.type !== 'import-domain-dropdown' || prevUIState.currOpenDropdown.domain !== domain) {
                            return prevUIState;
                        }

                        return {
                            ...prevUIState,
                            currOpenDropdown: undefined
                        }
                    })
                }
                searchable
            >
                {domainActions.map(action => {
                    console.log(action)
                    return (<DropdownItem
                        title={action.titleToolbar || action.longTitle}
                        subtext={action.tooltip}
                        key={action.staticType}
                        onClick={action.actionFunction}
                    />)
                })}
            </Dropdown>
        </ToolbarButton>);
    });

    // Put all solo buttons first, then all dropdown buttons
    const buttons: JSX.Element[] = [...soloButtons, ...dropdownButtons];
    return buttons;
}


export const DataTabContents = (
    props: {
        actions: Actions;
        uiState: UIState;
        setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    }): JSX.Element => {

    return (<div className='mito-toolbar-bottom'>
        <ToolbarButton
            action={props.actions.buildTimeActions[ActionEnum.Import_Files]}
        />
        <ToolbarButton
            action={props.actions.buildTimeActions[ActionEnum.Dataframe_Import]}
        />
        <ToolbarButton
            action={props.actions.buildTimeActions[ActionEnum.SNOWFLAKEIMPORT]}
        />
        {getToolbarButtonsForUserDefinedImports(props.actions, props.uiState, props.setUIState)}
        <div className='toolbar-vertical-line' />
        
        <ToolbarButton
            action={props.actions.buildTimeActions[ActionEnum.UPDATEIMPORTS]}
        />
        
        <div className='toolbar-vertical-line' />

        <div className='mito-toolbar-icon-buttons'>
            <ToolbarButton
                action={props.actions.buildTimeActions[ActionEnum.SortAscending]}
            />
            <ToolbarButton
                action={props.actions.buildTimeActions[ActionEnum.SortDescending]}
            />
        </div>

        <ToolbarButton
            action={props.actions.buildTimeActions[ActionEnum.Sort]}
        />
        <ToolbarButton
            action={props.actions.buildTimeActions[ActionEnum.Filter]}
        />

        <div className='toolbar-vertical-line' />

        <ToolbarButton
            action={props.actions.buildTimeActions[ActionEnum.Split_Text_To_Column]}
        />
        <ToolbarButton
            action={props.actions.buildTimeActions[ActionEnum.COLUMN_HEADERS_TRANSFORM]}
        />
        <ToolbarButton
            action={props.actions.buildTimeActions[ActionEnum.Drop_Duplicates]}
        />
        <div>
            <ToolbarButton
                action={props.actions.buildTimeActions[ActionEnum.Fill_Na]}
                orientation='horizontal'
            />
            <ToolbarButton
                action={props.actions.buildTimeActions[ActionEnum.One_Hot_Encoding]}
                orientation='horizontal'
            />
        </div>
        <ToolbarButton
            action={props.actions.buildTimeActions[ActionEnum.RESET_INDEX_DROPDOWN]}
        >
            <Dropdown
                display={props.uiState.currOpenDropdown === 'reset-index'}
                closeDropdown={() => 
                    props.setUIState(prevUIState => {
                        if (prevUIState.currOpenDropdown !== 'reset-index') {
                            return prevUIState;
                        }

                        return {
                            ...prevUIState,
                            currOpenDropdown: undefined
                        }
                    })
                }
                width={'medium'}
            >
                <DropdownItem
                    title='Reset and Keep Index'
                    key='reset-and-keep-index'
                    onClick={props.actions.buildTimeActions[ActionEnum.RESET_AND_KEEP_INDEX].actionFunction}
                />
                <DropdownItem
                    title='Reset and Drop Index'
                    key='reset-and-drop-index'
                    onClick={props.actions.buildTimeActions[ActionEnum.RESET_AND_DROP_INDEX].actionFunction}
                />
            </Dropdown>
        </ToolbarButton>
    </div>);
}