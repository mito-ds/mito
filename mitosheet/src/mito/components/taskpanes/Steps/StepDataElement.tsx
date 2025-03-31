/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */


import React from 'react';
import { StepSummary, StepType, UpdateType } from '../../../types';
import { MitoAPI } from '../../../api/api';

// Icons
import ImportIcon from '../../icons/ImportIcon';
import MergeIcon from '../../icons/MergeIcon';
import PivotIcon from '../../icons/PivotIcon'; 
import DeleteColumnIcon from '../../icons/DeleteColumnIcon';
import AddColumnIcon from '../../icons/AddColumnIcon';
import { FilterIcon } from '../../icons/FilterIcons';
import EditIcon from '../../icons/EditIcon';
import MitoIcon from '../../icons/MitoIcon';
import DropDuplicatesIcon from '../../icons/DropDuplicatesIcon';
import GraphIcon from '../../icons/GraphIcon';
import UnpivotIcon from '../../icons/UnpivotIcon';
import DtypeIcon from '../../icons/DtypeIcon';
import SplitTextToColumnsIcon from '../../icons/SplitTextToColumnsIcon';
import TransposeIcon from '../../icons/TransposeIcon';
import PromoteRowToHeaderIcon from '../../icons/PromoteRowToHeaderIcon';
import UndoIcon from '../../icons/UndoIcon';
import RedoIcon from '../../icons/RedoIcon';
import ClearIcon from '../../icons/ClearIcon';
import OneHotEncodingIcon from '../../icons/OneHotEncodingIcon';
import AIIcon from '../../icons/AIIcon';
import Dropdown from '../../elements/Dropdown';
import DropdownItem from '../../elements/DropdownItem';



export type StepDataElementProps = {
    beforeCurrIdx: boolean;
    stepIdx: number;
    isCurrIdx: boolean;
    lastIndex: number;
    stepData: StepSummary;
    mitoAPI: MitoAPI;
    isPro: boolean
    displayDropdown: boolean;
    setDisplayDropdown: React.Dispatch<React.SetStateAction<number | undefined>>
};

/* 
    Gets an icon for a specific step type, to display
    with that step
*/
export function getIcon(stepType: StepType | UpdateType, height?: string, width?: string): JSX.Element {
    switch (stepType) {
        case StepType.Initialize: return (
            <MitoIcon/>
        )
        case StepType.AiTransformation: return (
            <AIIcon/>
        )
        case StepType.AddColumn: return (
            <AddColumnIcon/>
        )
        case StepType.DeleteColumn: return (
            <DeleteColumnIcon/>
        )
        case StepType.RenameColumn: return (
            <EditIcon height={height} width={width}/>
        )
        case StepType.ReorderColumn: return (
            <EditIcon height={height} width={width}/>
        )
        case StepType.FilterColumn: return (
            <FilterIcon/>
        )
        case StepType.SetColumnFormula: return (
            <div className='step-taskpane-missing-icon'>
                Fx
            </div>
        )
        case StepType.DataframeDelete: return (
            <DeleteColumnIcon/>
        )
        case StepType.DataframeDuplicate: return (
            <EditIcon height={height} width={width}/>
        )
        case StepType.DataframeRename: return (
            <EditIcon height={height} width={width}/>
        )
        case StepType.SimpleImport: return (
            <ImportIcon/>
        )
        case StepType.DataframeImport: return (
            <ImportIcon/>
        )
        case StepType.ExcelImport: return (
            <ImportIcon/>
        )
        case StepType.Sort: return (
            <EditIcon height={height} width={width}/>
        )
        case StepType.Pivot: return (
            <PivotIcon/>
        )
        case StepType.Melt: return (
            <UnpivotIcon/>
        )
        case StepType.Merge: return (
            <MergeIcon/>
        )
        case StepType.DropDuplicates: return (
            <DropDuplicatesIcon/>
        )
        case StepType.Graph: return (
            <GraphIcon/>
        )
        case StepType.ChangeColumnDtype: return (
            <DtypeIcon/>
        )
        case StepType.DeleteRow: return (
            <DeleteColumnIcon/>
        )
        case StepType.SplitTextToColumns: return (
            <SplitTextToColumnsIcon/>
        )
        case StepType.Transpose: return (
            <TransposeIcon/>
        )
        case StepType.PromoteRowToHeader: return (
            <PromoteRowToHeaderIcon />
        )
        case StepType.OneHotEncoding: return (
            <OneHotEncodingIcon />
        )
        case UpdateType.Undo: return (
            <UndoIcon />
        )
        case UpdateType.Redo: return (
            <RedoIcon />
        )
        case UpdateType.Clear: return (
            <ClearIcon />
        )
        // TODO: Add a case here
        default: return (
            <EditIcon height={height} width={width}/>
        )
    }
}


/* 
    An element in a list that displays information about a step, and
    eventually will allow the user to interact with that step (e.g. 
    to start editing it).
*/
function StepDataElement(props: StepDataElementProps): JSX.Element {

    const toggleStepRollBack = (): void => {
        if (props.isCurrIdx) {
            // If this step is checked out, we go back to the last index
            void props.mitoAPI.updateCheckoutStepByIndex(props.lastIndex);
        } else {
            void props.mitoAPI.updateCheckoutStepByIndex(props.stepData.step_idx);
        }
    }

    const deleteFollowingSteps = (): void => {
        void props.mitoAPI.updateUndoToStepIndex(props.stepData.step_idx)
    }

    {/* We grey out any steps that are before the current step */ }
    return (
        <div 
            className='step-taskpane-step-container'
            style={{opacity: props.beforeCurrIdx ? '1': '.5'}}
            onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                props.setDisplayDropdown(props.stepIdx);
            }}
            onClick={toggleStepRollBack}
        >
            <div className='step-taskpane-step-icon'>
                {getIcon(props.stepData.step_type)}
            </div>
            <div className='element-width-block hide-scrollbar'>
                <div className='text-header-3'>
                    {props.stepData.step_display_name}
                </div>
                <div className='text-body-2 text-overflow-scroll hide-scrollbar'>
                    {props.stepData.step_description}
                </div>
            </div>
            <Dropdown 
                display={props.displayDropdown}
                closeDropdown={() => {props.setDisplayDropdown(undefined)}}
            >
                <DropdownItem 
                    title={'Undo all following steps'} 
                    onClick={() => deleteFollowingSteps()} 
                    disabled={!props.isPro}
                    subtext={!props.isPro ? 'Bulk step undo requires Mito Pro or Enterprise' : undefined}
                />
                <DropdownItem title={'View analysis at this step'} onClick={() => toggleStepRollBack()} />
            </Dropdown>
        </div>
    )
}

export default StepDataElement;
