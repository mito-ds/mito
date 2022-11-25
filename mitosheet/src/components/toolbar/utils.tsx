// Copyright (c) Mito
import React from 'react';

import UndoIcon from '../icons/UndoIcon';
import ImportIcon from '../icons/ImportIcon';
import ExportIcon from '../icons/ExportIcon';
import PivotIcon from '../icons/PivotIcon';
import DeleteColumnIcon from '../icons/DeleteColumnIcon';
import AddColumnIcon from '../icons/AddColumnIcon';
import { CloseFullscreenIcon, OpenFullscreenIcon } from '../icons/FullscreenIcons';
import StepsIcon from '../icons/StepsIcon';
import CatchUpIcon from '../icons/CatchUpIcon';
import GraphIcon from '../icons/GraphIcon';
import RedoIcon from '../icons/RedoIcon';
import ClearIcon from '../icons/ClearIcon';
import FormatIcon from '../icons/FormatIcon';
import DtypeIcon from '../icons/DtypeIcon';
import DropdownItem from '../elements/DropdownItem';
import { Action } from '../../types';
import MoreIcon from '../icons/MoreIcon';
import LessIcon from '../icons/LessIcon';

/* 
    Each toolbar button icon has both a light and dark option. 
    We use the light version when its on a dark background (ie: when 
    the toolbar button is hovered over), and the dark version when its 
    on a light background (ie: at rest). 
*/
export type IconVariant = 'light' | 'dark'

/* 
    Each button in the toolbar is one of the ToolbarButtonType.
    We use the ToolbarButtonType to get the correct icons for each button. 

    In the future, we will also use this type to do things like having one function
    that can be used to specify any toolbar item to have attention drawn to. ie: 
    through the tour. 
*/
export enum ToolbarButtonType {
    UNDO = 'UNDO',
    REDO = 'REDO',
    CLEAR = 'CLEAR',

    IMPORT = "IMPORT",
    EXPORT = "EXPORT",

    ADD_COL = "ADD COL",
    DEL_COL = "DEL COL",
    DTYPE = "DTYPE",

    LESS = "LESS",
    MORE = "MORE",
    FORMAT = "FORMAT",

    PIVOT = "PIVOT",
    GRAPH = "GRAPH",
    CATCH_UP = "CATCH UP",
    STEPS = "STEPS",
    OPEN_FULLSCREEN = "OPEN FULLSCREEN",
    CLOSE_FULLSCREEN = "CLOSE FULLSCREEN"
}

/* 
    Helper function for getting the light and dark version of each 
    toolbar icon. 
*/
export const getToolbarItemIcon = (toolbarButtonType: ToolbarButtonType): JSX.Element => {
    switch (toolbarButtonType) {
        case ToolbarButtonType.UNDO: {return <UndoIcon />}
        case ToolbarButtonType.REDO: {return <RedoIcon />}
        case ToolbarButtonType.CLEAR: {return <ClearIcon />}

        case ToolbarButtonType.IMPORT: {return <ImportIcon />}
        case ToolbarButtonType.EXPORT: {return <ExportIcon />}

        case ToolbarButtonType.ADD_COL: {return <AddColumnIcon />}
        case ToolbarButtonType.DEL_COL: {return <DeleteColumnIcon />}
        case ToolbarButtonType.DTYPE: {return <DtypeIcon />}

        case ToolbarButtonType.LESS: {return <LessIcon />}
        case ToolbarButtonType.MORE: {return <MoreIcon />}
        case ToolbarButtonType.FORMAT: {return <FormatIcon />}

        case ToolbarButtonType.PIVOT: {return <PivotIcon />}
        case ToolbarButtonType.GRAPH: {return <GraphIcon />}

        case ToolbarButtonType.CATCH_UP: {return <CatchUpIcon />}
        case ToolbarButtonType.STEPS: {return <StepsIcon />}
        case ToolbarButtonType.OPEN_FULLSCREEN: {return <OpenFullscreenIcon />}
        case ToolbarButtonType.CLOSE_FULLSCREEN: {return <CloseFullscreenIcon />}
    }
}

/**
 * A helper function that makes dropdown items for the toolbar menus. This is
 * a function and not a component itself because the dropdown _expects_ to get
 * a DropdownItem as it's child, so we cannot wrap this in another component
 */
export const makeToolbarDropdownItem = (action: Action, supressFocusSettingOnClose?: boolean): JSX.Element => {
    return (
        <DropdownItem 
            key={action.longTitle}
            title={action.longTitle}
            onClick={action.actionFunction}
            disabled={action.isDisabled() !== undefined}                   
            tooltip={action.isDisabled()}     
            rightText={
                window.navigator.userAgent.toUpperCase().includes('MAC')
                    ? action.displayKeyboardShortcuts?.mac
                    : action.displayKeyboardShortcuts?.windows
            }    
            supressFocusSettingOnClose={supressFocusSettingOnClose}
        />
    )
}