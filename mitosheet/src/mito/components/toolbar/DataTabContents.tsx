// Copyright (c) Mito


import React from 'react'

import { ActionEnum, UIState } from '../../types';
import { Actions } from '../../utils/actions';
import ToolbarButton from './ToolbarButton';
import Dropdown from '../elements/Dropdown';
import DropdownItem from '../elements/DropdownItem';
import ImportIcon from '../icons/ImportIcon';

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
        {props.actions.runtimeImportActionsList.map(action => {
            return (<ToolbarButton
                action={action}
                iconOverride={<ImportIcon />}
                key={action.staticType}
            />)
        })}

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
                display={props.uiState.toolbarDropdown === 'reset-index'}
                closeDropdown={() => 
                    props.setUIState(prevUIState => {
                        if (prevUIState.toolbarDropdown !== 'reset-index') {
                            return prevUIState;
                        }

                        return {
                            ...prevUIState,
                            toolbarDropdown: undefined
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