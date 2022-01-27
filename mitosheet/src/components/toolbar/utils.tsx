// Copyright (c) Mito
import React from 'react';

import UndoIcon from '../icons/UndoIcon';
import ImportIcon from '../icons/ImportIcon';
import ExportIcon from '../icons/ExportIcon';
import MergeIcon from '../icons/MergeIcon';
import PivotIcon from '../icons/PivotIcon';
import DeleteColumnIcon from '../icons/DeleteColumnIcon';
import AddColumnIcon from '../icons/AddColumnIcon';
import DocumentationIcon from '../icons/DocumentationIcon';
import { CloseFullscreenIcon, OpenFullscreenIcon } from '../icons/FullscreenIcons';
import StepsIcon from '../icons/StepsIcon';
import CatchUpIcon from '../icons/CatchUpIcon';
import GraphIcon from '../icons/GraphIcon';
import RedoIcon from '../icons/RedoIcon';
import ClearIcon from '../icons/ClearIcon';
import DropDuplicatesIcon from '../icons/DropDuplicatesIcon';
import FormatIcon from '../icons/FormatIcon';

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
    PIVOT = "PIVOT",
    MERGE = "MERGE",
    DROP_DUPLICATES = "DROP DUPLICATES",
    GRAPH = "GRAPH",
    FORMAT = "FORMAT",
    CATCH_UP = "CATCH UP",
    STEPS = "STEPS",
    DOCS = "DOCS",
    OPEN_FULLSCREEN = "OPEN FULLSCREEN",
    CLOSE_FULLSCREEN = "CLOSE FULLSCREEN"
}

/* 
    Helper function for getting the light and dark version of each 
    toolbar icon. 
*/
export const getToolbarItemIcon = (toolbarButtonType: ToolbarButtonType): {darkIcon: JSX.Element, lightIcon: JSX.Element} => {
    switch (toolbarButtonType) {
        case ToolbarButtonType.UNDO: return {
            darkIcon: <UndoIcon />,
            lightIcon: <UndoIcon variant='light' />
        }
        case ToolbarButtonType.REDO: return {
            darkIcon: <RedoIcon />,
            lightIcon: <RedoIcon variant='light' />
        }
        case ToolbarButtonType.CLEAR: return {
            darkIcon: <ClearIcon />,
            lightIcon: <ClearIcon variant='light' />
        }
        case ToolbarButtonType.IMPORT: return {
            darkIcon: <ImportIcon />,
            lightIcon: <ImportIcon variant='light' />
        }
        case ToolbarButtonType.EXPORT: return {
            darkIcon: <ExportIcon />,
            lightIcon: <ExportIcon variant='light' />
        }
        case ToolbarButtonType.ADD_COL: return {
            darkIcon: <AddColumnIcon />,
            lightIcon: <AddColumnIcon variant='light' />
        }
        case ToolbarButtonType.DEL_COL: return {
            darkIcon: <DeleteColumnIcon />,
            lightIcon: <DeleteColumnIcon variant='light' />
        }
        case ToolbarButtonType.PIVOT: return {
            darkIcon: <PivotIcon />,
            lightIcon: <PivotIcon variant='light' />
        }
        case ToolbarButtonType.MERGE: return {
            darkIcon: <MergeIcon />,
            lightIcon: <MergeIcon variant='light' />
        }
        case ToolbarButtonType.DROP_DUPLICATES: return {
            darkIcon: <DropDuplicatesIcon />,
            lightIcon: <DropDuplicatesIcon variant='light' />
        }
        case ToolbarButtonType.GRAPH: return {
            darkIcon: <GraphIcon />,
            lightIcon: <GraphIcon variant='light' />
        }
        case ToolbarButtonType.FORMAT: return {
            darkIcon: <FormatIcon />,
            lightIcon: <FormatIcon variant='light' />
        }
        case ToolbarButtonType.CATCH_UP: return {
            darkIcon: <CatchUpIcon />,
            lightIcon: <CatchUpIcon variant='light' />
        }
        case ToolbarButtonType.STEPS: return {
            darkIcon: <StepsIcon />,
            lightIcon: <StepsIcon variant='light' />
        }
        case ToolbarButtonType.DOCS: return {
            darkIcon: <DocumentationIcon />,
            lightIcon: <DocumentationIcon variant='light' />
        }
        case ToolbarButtonType.OPEN_FULLSCREEN: return {
            darkIcon: <OpenFullscreenIcon />,
            lightIcon: <OpenFullscreenIcon variant='light' />
        }
        case ToolbarButtonType.CLOSE_FULLSCREEN: return {
            darkIcon: <CloseFullscreenIcon />,
            lightIcon: <CloseFullscreenIcon variant='light' />
        }
    }
}