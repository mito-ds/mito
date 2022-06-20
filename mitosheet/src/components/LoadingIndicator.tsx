// Copyright (c) Mito

import React, { useEffect, useState } from 'react';

// import css
import "../../css/loading-indicator.css";
import { StepType, UpdateType } from '../types';
import { classNames } from '../utils/classNames';
import { getIcon } from './taskpanes/Steps/StepDataElement';

const isStepEvent = (messageType: string): boolean => {
    return messageType.endsWith('_edit')
}
const isUpdateEvent = (messageType: string): boolean => {
    return Object.values(UpdateType).includes(messageType as any)
}

const getDisplayMessageForMessageType = (messageType: StepType | UpdateType): string => {
    switch (messageType) {
        case StepType.Initialize: {
            return 'Created a Mitosheet'
        }
        case StepType.AddColumn: {
            return 'Adding a column'
        }
        case StepType.DeleteColumn: {
            return 'Deleting a column'
        }
        case StepType.RenameColumn: {
            return 'Renaming a column'
        }
        case StepType.ReorderColumn: {
            return 'Reording a column'
        }
        case StepType.FillNa: {
            return 'Filling NaN values'
        }
        case StepType.FilterColumn: {
            return 'Filtering a column'
        }
        case StepType.SetColumnFormula: {
            return 'Setting a formula'
        }
        case StepType.DataframeDelete: {
            return 'Deleting a dataframe'
        }
        case StepType.DataframeDuplicate: {
            return 'Duplicating a dataframe'
        }
        case StepType.DataframeRename: {
            return 'Renaming a dataframe'
        }
        case StepType.SimpleImport: {
            return 'Importing a CSV'
        }
        case StepType.Sort: {
            return 'Sorting'
        }
        case StepType.Pivot: {
            return 'Pivoting'
        }
        case StepType.Merge: {
            return 'Merging'
        }
        case StepType.Concat: {
            return 'Concatenating dataframes'
        }
        case StepType.DropDuplicates: {
            return 'Dropping duplicates'
        }
        case StepType.ChangeColumnDtype: {
            return 'Changing a dtype'
        }
        case StepType.ChangeColumnFormat: {
            return 'Formatting'
        }
        case StepType.SetCellValue: {
            return 'Setting a cell value'
        }
        case StepType.BulkOldRename: {
            return 'Bulk old rename'
        }
        case StepType.ExcelImport: {
            return 'Import an Excel file'
        }
        case StepType.Graph: {
            return 'Creating graph'
        }
        case StepType.GraphDuplicate: {
            return 'Duplicating graph'
        }
        case StepType.GraphDelete: {
            return 'Deleting graph'
        }
        case StepType.GraphRename: {
            return 'Renaming graph'
        }
        case StepType.DeleteRow: {
            return 'Deleting row'
        }
        case StepType.PromoteRowToHeader: {
            return 'Promoting row to header'
        }
        case StepType.SplitTextToColumns: {
            return 'Spliting column'
        }
        case StepType.Transpose: {
            return 'Transposing dataframe'
        }
        case StepType.Melt: {
            return 'Melting dataframe'
        }
        case UpdateType.Undo: {
            return 'Undo previous edit'
        }
        case UpdateType.Redo: {
            return 'Redo previous edit'
        }
        case UpdateType.Clear: {
            return 'Clear all edits'
        }
        case UpdateType.ArgsUpdate: {
            return 'Updating user profile';
        }
        case UpdateType.SaveAnalysisUpdate: {
            return 'Saving current analysis'
        }
        case UpdateType.ReplayAnalysisUpdate: {
            return 'Replaying previous analysis'
        }
        case UpdateType.CheckoutStepByIdxUpdate: {
            return 'Checking out previous step'
        }
        case UpdateType.AppendUserFieldUpdate: {
            return 'Updating user profile'
        }
        case UpdateType.SetUserFieldUpdate: {
            return 'Updating user profile'
        }
        case UpdateType.UpdateFeedbackv2ObjObject: {
            return 'Updating user profile'
        }
        case UpdateType.GoPro: {
            return 'Activating Mito Pro'
        }
        case UpdateType.RenderCountUpdate: {
            return 'Updating user profile'
        }
    }
}

const getMessageType = (messageType: string): StepType | UpdateType | undefined => {
    if (isStepEvent(messageType)) {
        return messageType.substring(0, messageType.length - "_edit".length) as StepType;
    } else if  (isUpdateEvent(messageType)) {
        return messageType as UpdateType;
    }
    
    return undefined;
}

const getMessageTypesToDisplay  = (loading: [string, string | undefined, string][]): (StepType | UpdateType)[] => {
    const seenStepIds: string[] = []
    return loading.filter((([message_id, step_id, type]) => {
        // We filter out any edits that have duplicated step ids, as users think of 
        // these as just a single edit. We only take the first one!
        if (step_id !== undefined) {
            if (seenStepIds.includes(step_id)) {
                return false;
            }
            seenStepIds.push(step_id);
        }
        return true;

    })).map((([message_id, step_id, type]) => {
        return getMessageType(type);
    })).filter(messageType => {
        return messageType !== undefined;
    }) as (StepType | UpdateType)[];
}



/*
    Tells the user what is still loading

    By default, does not displaying anything for the first .5 seconds it
    is rendered, so that only long running ops actually display a loading
    bar.
*/
const LoadingIndicator = (props: {loading: [string, string | undefined, string][]}): JSX.Element => {
    const [display, setDisplay] = useState(false);

    // Only display this after 500 ms
    useEffect(() => {
        setTimeout(() => {
            setDisplay(true);
        }, 500);
    }, []);

    // We start the indicator at -1, so that we don't display anything
    // for the first half second. This makes us only display the indicator
    // for actually long running operations.
    if (!display) {
        return <React.Fragment/>
    }

    const messageTypesToDisplay = getMessageTypesToDisplay(props.loading);


    return (
        <div className='loading-indicator-container'>
            <p className='loading-indicator-header text-header-2 text-color-white-important'>
                Processing {messageTypesToDisplay.length} edit{messageTypesToDisplay.length <= 1 ? '' : 's'}
            </p>
            <div className='loading-indicator-content'>
                {messageTypesToDisplay.map(((messageType, index) => {

                    return (messageType !== undefined && 
                        <div 
                            key={index} 
                            className={classNames('loading-indicator-item', 'text-body-1', {'text-color-medium-gray-important': index !== 0})}
                        >
                            <div className='loading-indicator-icon'>
                                {getIcon(messageType)}
                            </div>
                            <div className='ml-20px'>
                                {getDisplayMessageForMessageType(messageType)}
                            </div>
                            <div className='loading-indicator-loader'>
                                ...
                            </div>
                        </div>)
                }))}
            </div>
        </div>
    );
};

export default LoadingIndicator;