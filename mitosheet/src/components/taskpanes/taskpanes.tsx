// Copyright (c) Mito

import { GraphID } from "../../types"
import { BackendPivotParams } from "../../types"

/* 
    Each Taskpane has a type (included TaskpaneType.NONE, which is the type of _no taskpane_ (e.g. nothing is displayed)).

    If you want to be able to open a taskpane in Mito, then you need to add the type of this taskpane, 
    as well as any __unique__ parameters it has, to this type.

    For example, if you create a new taskpane 'Dork' that takes a selectedSheetIndex as input, then you don't need to 
    add a param to Dork here because the selectedSheetIndex is already stored in the Mito state. But if Dork takes a param
    timeOfOpen, which is not stored in the Mito state already, then you must add timeOfOpen to the params here. 

    It would look like this: 
        | {type: 'TaskpaneType.DORK', timeOfOpen: string}

    By adding any special params to the taskpane type we ensure that any time we create the taskpane, the special param
    is added to the state (this happens through the setCurrOpenTaskpane function. 

    Then, when we are actually setting the taskpane component in getCurrOpenTaskpane, we're able to access the special param using
    this.state.currOpenTaskpane.timeOfOpen
*/
export enum TaskpaneType {
    CONTROL_PANEL = 'control_panel',
    DOWNLOAD = 'download',
    DROP_DUPLICATES = 'drop_duplicates',
    GRAPH = 'graph',
    IMPORT = 'import',
    MERGE = 'merge',
    CONCAT = 'concat',
    NONE = 'none',
    PIVOT = 'pivot',    
    SEARCH = 'search',
    STEPS = 'steps',
}

export type TaskpaneInfo = 
    | {type: TaskpaneType.CONTROL_PANEL}
    | {type: TaskpaneType.DOWNLOAD}
    | {type: TaskpaneType.DROP_DUPLICATES}
    | {
        type: TaskpaneType.GRAPH,
        graphID: GraphID,
    }    
    | {type: TaskpaneType.IMPORT}
    | {type: TaskpaneType.MERGE}
    | {type: TaskpaneType.CONCAT}
    | {type: TaskpaneType.NONE}
    | {
        type: TaskpaneType.PIVOT,
        // Optional params only defined if this is a pivot
        // editing a specific existing pivot table
        destinationSheetIndex?: number;
        existingPivotParams?: BackendPivotParams, 
    } 
    | {type: TaskpaneType.SEARCH}
    | {type: TaskpaneType.STEPS}
    

/*
    EDITING_TASKPANES are taskpanes that live update the sheet using overwriting 
    and therefore should be closed when the user begins editing the sheet 
    through some other method. 
*/ 
export const EDITING_TASKPANES: TaskpaneType[] = [
    TaskpaneType.PIVOT, 
    TaskpaneType.MERGE, 
    TaskpaneType.IMPORT,
    TaskpaneType.DROP_DUPLICATES,
    TaskpaneType.DOWNLOAD,
    TaskpaneType.CONCAT,
]

/**
 * Editing taskpanes where undo / redo should not close them, but rather
 * keep them open (e.g. so they can refresh params)
 */
export const ALLOW_UNDO_REDO_EDITING_TASKPANES = [TaskpaneType.PIVOT, TaskpaneType.IMPORT, TaskpaneType.CONCAT]
    