// Copyright (c) Mito

import React from 'react';
import { ActionEnum, UIState, UserProfile } from '../../types';
import { Actions } from '../../utils/actions';
import Dropdown from '../elements/Dropdown';
import DropdownSectionSeperator from '../elements/DropdownSectionSeperator';
import { makeToolbarDropdownItem } from './utils';


interface ToolbarDataframesDropdownProps {
    actions: Actions;
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>
    userProfile: UserProfile
}

/**
 * Dropdown that displays all the actions that are available for editing dataframes.
 */ 
const ToolbarDataframesDropdown = (props: ToolbarDataframesDropdownProps): JSX.Element => {

    const runTimeImportDropownItems: JSX.Element[] = props.actions.runtimeImportActionsList.map(action => makeToolbarDropdownItem(action, props.userProfile));

    const dropdownItems: JSX.Element[] = [
        makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Import_Files], props.userProfile),
        makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Dataframe_Import], props.userProfile),
        <></>, // Placeholder for Snowflake Import, if displayed. NOTE: THIS MUST STAY AT THIS INDEX
        ...runTimeImportDropownItems,
        makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.UPDATEIMPORTS], props.userProfile),
        <DropdownSectionSeperator isDropdownSectionSeperator/>,
        makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Export], props.userProfile),
        makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.EXPORT_TO_FILE], props.userProfile),
        <DropdownSectionSeperator isDropdownSectionSeperator/>,
        makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Pivot], props.userProfile),
        makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Melt], props.userProfile),
        makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Drop_Duplicates], props.userProfile),
        makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Merge], props.userProfile),
        makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Concat_Dataframes], props.userProfile),
        makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Transpose], props.userProfile),
        <DropdownSectionSeperator isDropdownSectionSeperator/>,
        makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Duplicate_Dataframe], props.userProfile),
        makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Rename_Dataframe], props.userProfile, true),
        makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Delete_Dataframe], props.userProfile),
    ]

    if (props.userProfile.mitoConfig.MITO_CONFIG_FEATURE_DISPLAY_SNOWFLAKE_IMPORT) {
        dropdownItems[2] = makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.SNOWFLAKEIMPORT], props.userProfile);
    }


    return (
        <>
            <Dropdown 
                display={props.uiState.currOpenToolbarDropdown === 'Dataframes'}
                closeDropdown={() => props.setUIState((prevUIState) => {
                    // Only close this dropdown if it's actually the one that is open, to avoid race conditions
                    if (prevUIState.currOpenToolbarDropdown === 'Dataframes') {
                        return {
                            ...prevUIState,
                            currOpenToolbarDropdown: undefined
                        }
                    }
                    return prevUIState;
                })}
                width='large'
            >
                {dropdownItems}
            </Dropdown>
        </>
    );
}

export default ToolbarDataframesDropdown;