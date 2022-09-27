import React, { useCallback, useState } from "react";
import MitoAPI, { getRandomId } from "../jupyter/api";
import { AnalysisData } from "../types";
import { isMitoError } from "../utils/errors";
import { useEffectOnRedo } from "./useEffectOnRedo";
import { useEffectOnUndo } from "./useEffectOnUndo";

/* 
    This custom hook is built for taskpanes that edit the current sheet, 
    which makes it easy to do the following:

    If an edit event edits an existing sheet:
    1. It should be *opt in* when a user opens a taskpane. It should not automatically be applied. 
    2. If you perform an action, you can press undo to undo it. 
    3. If you perform a new action, **it does not overwrite the previous action.**
*/
function useSendEditOnClick<ParamType, ResultType>(
    defaultParams: ParamType | undefined | (() => ParamType | undefined),
    stepType: string,
    mitoAPI: MitoAPI,
    analysisData: AnalysisData,
    options?: {
        allowSameParamsToReapplyTwice: boolean
    },
    overideEdit?: (params: ParamType) => void,
): {
        params: ParamType | undefined, // If this is undefined, no messages will be sent to the backend
        setParams: React.Dispatch<React.SetStateAction<ParamType>>, 
        error: string | undefined,
        loading: boolean // This loading indicator is for if the edit message is processing
        edit: (finalTransform?: (params: ParamType) => ParamType) => void; // Actually applies the edit. You can optionally pass a function that does one final transformation on the params
        editApplied: boolean; // True if any edit is applied. E.g. the user has clicked a button, created a step, and not undone it.
        attemptedEditWithTheseParamsMultipleTimes: boolean; // True if the user applies the edit, and then clicks the edit button again without changing the params
        result: ResultType | undefined; // The result of this edit. Undefined if no edit is applied (or if the step has no result)
    } {

    const [params, _setParams] = useState(defaultParams);
    const [error, setError] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    
    // We store a list of all the step IDs that have been applied or
    // are sitting inside of the redo buffer waiting to reapplied. We
    // also store the current index that we're at in these step ids
    const [stepIDData, setStepIDData] = useState<{stepIDs: string[], currStepIDIndex: number}>({
        stepIDs: [], 
        currStepIDIndex: 0
    });
    // We need to store if the params have been applied in a step so that
    // we can detect if users are pressing a button for a second time without 
    // changing the params
    const [paramsApplied, setParamsApplied] = useState(false);
    // We also store if the user clicks the button to apply the same edit multiple
    // times, so that we can tell them they have done this
    const [attemptedEditWithTheseParamsMultipleTimes, setAttemptedEditWithTheseParamsMultipleTimes] = useState(false);

    useEffectOnUndo(() => {
        void refreshOnUndo()
    }, analysisData)

    useEffectOnRedo(() => {
        void refreshOnRedo();
    }, analysisData)

    // NOTE: all edit events are the name of the step + _edit
    const editEvent = stepType + '_edit';

    // We wrap the _setParams call so that we can track when the params have not
    // yet been sent to the backend
    const setParams: React.Dispatch<React.SetStateAction<ParamType>> = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (args: any) => {
            _setParams(args); // update the params
            setParamsApplied(false); // mark them as not applied
            setAttemptedEditWithTheseParamsMultipleTimes(false); // mark the user as not having applied the edit multiple times
        },
        [],
    );

    // This function actually sends the edit message to the backend
    const edit = async (finalTransform?: (params: ParamType) => ParamType) => {
        // Do not send an edit message if the params are undefined
        // or if we have already sent a message for these params
        if (params === undefined) {
            return;
        } else if (!options?.allowSameParamsToReapplyTwice && paramsApplied) {
            setAttemptedEditWithTheseParamsMultipleTimes(true);
            return;
        }

        // If the consumer passes a final transform function, then we do this final
        // transformation before we actually send the edit
        const finalParams = finalTransform ? finalTransform(params) : params;

        setLoading(true);
        const newStepID = getRandomId(); // always use a new step id

        console.log("in edit function")
        let possibleError = undefined
        if (overideEdit === undefined) {
            console.log('override edit is undefined')
            possibleError = await mitoAPI._edit<ParamType>(editEvent, finalParams, newStepID);
        } else {
            console.log('override edit is not undefined')
            possibleError = overideEdit(finalParams)
        }
        setLoading(false);

        // Handle if we return an error
        if (isMitoError(possibleError)) {
            setError(possibleError.to_fix);
        } else {
            // Update our step id tracking
            setStepIDData(prevStepIDData => {
                const newStepIDData = {stepIDs: [...prevStepIDData.stepIDs], currStepIDIndex: prevStepIDData.currStepIDIndex};
                // If we edit, then the redo buffer is cleared, so we can clear all _later_ step ids
                newStepIDData.stepIDs.splice(newStepIDData.currStepIDIndex + 1, newStepIDData.stepIDs.length);
                // Then, we add the new step id that we created
                newStepIDData.stepIDs.push(newStepID);
                // And mark this as the current index we're on
                newStepIDData.currStepIDIndex = newStepIDData.stepIDs.length - 1;
                
                return newStepIDData;
            })

            // Clear the error and mark the params as having been applied
            setError(undefined)
            setParamsApplied(true);
        }
    }


    // On an undo, we need to decrease the step id index, and also refresh the params from
    // the backend
    const refreshOnUndo = async () => {
        
        // Get the step id
        const stepID = stepIDData.stepIDs[stepIDData.currStepIDIndex - 1];

        // First, we need to knock back the current step id index
        setStepIDData(prevStepIDData => {
            const newStepIDData = {stepIDs: [...prevStepIDData.stepIDs], currStepIDIndex: prevStepIDData.currStepIDIndex};
            newStepIDData.currStepIDIndex -= 1;
            return newStepIDData;
        })


        const newParams = await mitoAPI.getParams<typeof defaultParams>(stepType, stepID, {});
        if (newParams !== undefined) {
            _setParams(newParams);
        } else {
            _setParams(defaultParams);
            setParamsApplied(false);
        }

        // We also clear the error in this case, as this clearly was effectively applied
        setError(undefined);
    }

    // Like undo, we also have to refresh on redo. Here, we bump the step id we're trying
    // to get the params for, and also get the new params that were applied
    const refreshOnRedo = async () => {
        
        // Get the step id
        const stepID = stepIDData.stepIDs[stepIDData.currStepIDIndex + 1];

        // First, we need to bump the current step id index
        setStepIDData(prevStepIDData => {
            const newStepIDData = {stepIDs: [...prevStepIDData.stepIDs], currStepIDIndex: prevStepIDData.currStepIDIndex};
            newStepIDData.currStepIDIndex += 1;
            return newStepIDData;
        })

        const newParams = await mitoAPI.getParams<typeof defaultParams>(stepType, stepID, {});
        if (newParams !== undefined) {
            _setParams(newParams);
            // If we redo successfully, we also need to mark this as _nothing new_ so that
            // clicking the button does not reapply again
            setParamsApplied(true);
        }

        // Also clear the error
        setError(undefined);        
    }

    let result: ResultType | undefined = undefined;
    // If the params were applied, and the last step is actually this type of step.
    // then we might have a result to apply to the user
    if (paramsApplied && analysisData.stepSummaryList[analysisData.stepSummaryList.length - 1].step_type === stepType) {
        result = analysisData.lastResult as ResultType
    }

    return {
        params: params,
        setParams: setParams,
        error: error,
        loading: loading,
        edit: edit,
        editApplied: paramsApplied,
        attemptedEditWithTheseParamsMultipleTimes: attemptedEditWithTheseParamsMultipleTimes,
        result: result
    }
}

export default useSendEditOnClick;