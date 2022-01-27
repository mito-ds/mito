// Copyright (c) Mito

import React from 'react';
import { StepSummary, StepType } from '../../../types';
import MitoAPI from '../../../api';

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


export type StepDataElementProps = {
    beforeCurrIdx: boolean;
    isCurrIdx: boolean;
    lastIndex: number;
    stepData: StepSummary;
    mitoAPI: MitoAPI;
};

/* 
    Gets an icon for a specific step type, to display
    with that step
*/
export function getStepIcon(stepType: StepType): JSX.Element {
    switch (stepType) {
        case StepType.Initialize: return (
            <MitoIcon/>
        )
        case StepType.AddColumn: return (
            <AddColumnIcon/>
        )
        case StepType.DeleteColumn: return (
            <DeleteColumnIcon/>
        )
        case StepType.RenameColumn: return (
            <EditIcon/>
        )
        case StepType.ReorderColumn: return (
            <EditIcon/>
        )
        case StepType.FilterColumn: return (
            <FilterIcon />
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
            <EditIcon/>
        )
        case StepType.DataframeRename: return (
            <EditIcon/>
        )
        case StepType.SimpleImport: return (
            <ImportIcon/>
        )
        case StepType.ExcelImport: return (
            <ImportIcon/>
        )
        case StepType.Sort: return (
            <EditIcon/>
        )
        case StepType.Pivot: return (
            <PivotIcon/>
        )
        case StepType.Merge: return (
            <MergeIcon/>
        )
        case StepType.DropDuplicates: return (
            <DropDuplicatesIcon/>
        )
        // TODO: Add a case here
        default: return (
            <EditIcon/>
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
            void props.mitoAPI.checkoutStepByIndex(props.lastIndex);
        } else {
            void props.mitoAPI.checkoutStepByIndex(props.stepData.step_idx);
        }
    }

    {/* We grey out any steps that are before the current step */ }
    return (
        <div 
            className='step-taskpane-step-container' 
            style={{opacity: props.beforeCurrIdx ? '1': '.5'}}
            onClick={toggleStepRollBack}
        >
            <div className='step-taskpane-step-icon'>
                {getStepIcon(props.stepData.step_type)}
            </div>
            <div className='element-width-block'>
                <div className='text-header-3'>
                    {props.stepData.step_display_name}
                </div>
                <div className='text-body-2 text-overflow-scroll'>
                    {props.stepData.step_description}
                </div>
            </div>
        </div>
    )
}

export default StepDataElement;