// Copyright (c) Mito

import React, { useEffect, useState } from 'react';

// import css
import "../../css/loading-indicator.css";
import { StepType, UpdateType } from '../types';
import { classNames } from '../utils/classNames';
import LoadingCircle from './icons/LoadingCircle';
import NonLoadingCircle from './icons/NonLoadingCircle';
import { getIcon } from './taskpanes/Steps/StepDataElement';

const isEditEvent = (messageType: string): boolean => {
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
            return 'Sorting a dataframe'
        }
        case StepType.Pivot: {
            return 'Pivoting a dataframe'
        }
        case StepType.Merge: {
            return 'Merging dataframes'
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
            return 'Formatting columns'
        }
        case StepType.SetCellValue: {
            return 'Setting a cell value'
        }
        case StepType.BulkOldRename: {
            return 'Bulk old rename'
        }
        case StepType.ExcelImport: {
            return 'Importing Excel file'
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
        case StepType.OneHotEncoding: {
            return 'One hot encoding'
        }
        case UpdateType.Undo: {
            return 'Undoing previous edit'
        }
        case UpdateType.Redo: {
            return 'Redoing previous edit'
        }
        case UpdateType.Clear: {
            return 'Clearing all edits'
        }
        case UpdateType.ArgsUpdate: {
            return 'Updating user profile';
        }
        case UpdateType.SaveAnalysisUpdate: {
            return 'Saving analysis'
        }
        case UpdateType.ReplayAnalysisUpdate: {
            return 'Replaying analysis'
        }
        case UpdateType.CheckoutStepByIdxUpdate: {
            return 'Checking out step'
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
    if (isEditEvent(messageType)) {
        return messageType.substring(0, messageType.length - "_edit".length) as StepType;
    } else if  (isUpdateEvent(messageType)) {
        return messageType as UpdateType;
    }
    
    return undefined;
}

const getMessageTypesToDisplay  = (loading: [string, string | undefined, string][]): [(StepType | UpdateType), string][] => {
    const seenStepIds: string[] = []
    return loading.filter((([, step_id, ]) => {
        // We filter out any edits that have duplicated step ids, as users think of 
        // these as just a single edit. We only take the first one!
        if (step_id !== undefined) {
            if (seenStepIds.includes(step_id)) {
                return false;
            }
            seenStepIds.push(step_id);
        }
        return true;

    })).map((([message_id, , type]) => {
        return [getMessageType(type), message_id];
    })).filter(([messageType, ]) => {
        return messageType !== undefined;
    }) as [(StepType | UpdateType), string][];
}


const getSlowLoadingMessage = (currentLoadingMessage: [number, string] | undefined, message_id: string): string | undefined => {
    const is10SecondsAgo = currentLoadingMessage && message_id === currentLoadingMessage[1] && (currentLoadingMessage[0] <= Date.now() - 10 * 1000);
    const is20SecondsAgo = currentLoadingMessage && message_id === currentLoadingMessage[1] && (currentLoadingMessage[0] <= Date.now() - 20 * 1000);
    const is30SecondsAgo = currentLoadingMessage && message_id === currentLoadingMessage[1] && (currentLoadingMessage[0] <= Date.now() - 30 * 1000);
    const is40SecondsAgo = currentLoadingMessage && message_id === currentLoadingMessage[1] && (currentLoadingMessage[0] <= Date.now() - 40 * 1000);
    const is50SecondsAgo = currentLoadingMessage && message_id === currentLoadingMessage[1] && (currentLoadingMessage[0] <= Date.now() - 40 * 1000);
    const is60SecondsAgo = currentLoadingMessage && message_id === currentLoadingMessage[1] && (currentLoadingMessage[0] <= Date.now() - 60 * 1000);

    if (is60SecondsAgo) {
        return "Still executing pandas code";
    } else if (is50SecondsAgo) {
        return "Doing the dataframe dance";
    } else if (is40SecondsAgo) {
        return "Working hard behind the scenes";
    } else if (is30SecondsAgo) {
        return "Still executing pandas code";
    } else if (is20SecondsAgo) {
        return "Doing the dataframe dance";
    } else if (is10SecondsAgo) {
        return "Still executing pandas code";
    }

    return undefined;
} 



/*
    Gives the user lots of information about what events and updates
    and loading.

    By default, does not displaying anything for the first .5 seconds it
    is rendered, so that only long running ops actually display anything.
*/
const LoadingIndicator = (props: {loading: [string, string | undefined, string][]}): JSX.Element => {

    // We store the message at the top of the loading queue, so that we can 
    // track if it has been running for longer than 10 seconds
    const [currentLoadingMessage, setCurrentLoadingMessage] = useState<undefined | [number, string]>(undefined);

    // This effect tracks the top message and when it becomes the top message
    // so that we can give the user special messages when things have been 
    // loading for longer than 10 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            const messagesToDisplay = getMessageTypesToDisplay(props.loading);
            if (messagesToDisplay.length === 0) {
                setCurrentLoadingMessage(undefined);
            } else {
                setCurrentLoadingMessage(prevLoadingMessage => {
                    const topMessageID = messagesToDisplay[0][1];
                    if (prevLoadingMessage === undefined || topMessageID !== prevLoadingMessage[1]) {
                        return [Date.now(), topMessageID];
                    }
                    return prevLoadingMessage;
                })
            }
            // We always refresh this state, though, so that this rerenders 
            // so that we can refresh the messaging to the user
            setCurrentLoadingMessage(prevCurrentLoadingMessage => {
                if (prevCurrentLoadingMessage === undefined) return prevCurrentLoadingMessage;
                return [prevCurrentLoadingMessage[0], prevCurrentLoadingMessage[1]];
            })
        }, 1000)
        return () => {clearInterval(interval)};
    }, [props.loading])


    const messagesToDisplay = getMessageTypesToDisplay(props.loading);

    if (messagesToDisplay.length === 0) {
        return <React.Fragment/>
    }

    return (
        <>
            <p className='loading-indicator-header text-header-3 text-color-white-important'>
                Processing {messagesToDisplay.length} edit{messagesToDisplay.length <= 1 ? '' : 's'}
            </p>
            <div className='loading-indicator-content'>
                {messagesToDisplay.map((([messageType, message_id], index) => {
                    const slowLoadingMessage = getSlowLoadingMessage(currentLoadingMessage, message_id);

                    return (messageType !== undefined && 
                        <div className={classNames('mb-5px', 'mt-5px', {'text-color-medium-gray-important': index !== 0})}>
                            <div 
                                key={index} 
                                className={classNames('loading-indicator-item')}
                            >
                                <div className='loading-indicator-icon' style={{opacity: index !== 0 ? '50%' : undefined}}>
                                    {getIcon(messageType, '15', '15')}
                                </div>
                                <div className='ml-5px'>
                                    <div className='text-body-1'>
                                        {getDisplayMessageForMessageType(messageType)}
                                    </div>
                                    {slowLoadingMessage !== undefined &&
                                        <div className='text-subtext-1'>
                                            {slowLoadingMessage}
                                        </div>
                                    }
                                </div>
                                
                                <div className='loading-indicator-loader'>
                                    {index === 0 && <LoadingCircle/>}
                                    {index !== 0 && <NonLoadingCircle/>}
                                </div>
                            </div>
                        </div>    
                    )
                }))}
            </div>
        </>
    );
};

export default LoadingIndicator;