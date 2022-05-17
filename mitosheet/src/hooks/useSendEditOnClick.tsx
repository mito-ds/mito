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
    1. It should be *opt in* when a user opens a taskpane. It should not automatically is applied. 
    2. If you perform an action, you can press undo to undo it. 
    3. If you perform a new action, **it does not overwrite the previous action.**
*/
function useSendEditOnClick<ParamType, ResultType>(
    defaultParams: ParamType | undefined,
    stepType: string,
    mitoAPI: MitoAPI,
    analysisData: AnalysisData,
): {
        params: ParamType | undefined, // If this is undefined, no messages will be send to the backend
        setParams: React.Dispatch<React.SetStateAction<ParamType>>, 
        error: string | undefined,
        loading: boolean // This loading indicator is for if the edit message is processing
        edit: () => void;
        editApplied: boolean;
        result: ResultType | undefined;
    } {

    const [params, _setParams] = useState(defaultParams);
    const [error, setError] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    
    // We store a list of all the step IDs that have been applied or
    // are sitting inside of the redo buffer waiting to reapplied. We
    // also store the current index that we're at in these step ids
    const [stepIDData, setStepIDData] = useState<{stepIDs: string[], currStepIDIndex: number}>({stepIDs: [], currStepIDIndex: 0});
    const [paramsNotApplied, setParamsNotApplied] = useState(true);

    useEffectOnUndo(() => {
        void refreshOnUndo()
    }, analysisData)

    useEffectOnRedo(() => {
        void refreshOnRedo();
    }, analysisData)

    // NOTE: all edit events are the name of the step + _edit
    const editEvent = stepType + '_edit';

    // We wrap the _setParams call we use internally, so that when the consumer
    // of the setParams function outside of this hook calls it, we automatically
    // update the updateNumber by one, which allows a message to get sent to the
    // backend. This makes life very plesant for the consumer of this hook, as 
    // they don't have to remember to increment a setUpdateNumber state variable
    // by one every time they change the params
    const setParams: React.Dispatch<React.SetStateAction<ParamType>> = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (args: any) => {
            _setParams(args); // update the params
            setParamsNotApplied(true); // mark them as not applied
        },
        [],
    );

    const edit = async (): Promise<ResultType | undefined> => {
        // Do not send an edit message if the params are undefined
        // or if we have already sent a message for these params
        if (params === undefined || !paramsNotApplied) {
            return undefined;
        }

        setLoading(true);
        const newStepID = getRandomId();
        const resultOrError = await mitoAPI._edit<ParamType, ResultType>(editEvent, params, newStepID);
        setLoading(false);

        // Handle if we return an error
        if (isMitoError(resultOrError)) {
            setError(resultOrError.to_fix);
        } else {
            // Clear any step IDs we no longer need, and use this new step ID
            setStepIDData(prevStepIDData => {
                const newStepIDData = {stepIDs: [...prevStepIDData.stepIDs], currStepIDIndex: prevStepIDData.currStepIDIndex};
                // Clear the old ones
                newStepIDData.stepIDs.splice(newStepIDData.currStepIDIndex + 1, newStepIDData.stepIDs.length);
                // Add the new one
                newStepIDData.stepIDs.push(newStepID);
                // Update the index!
                newStepIDData.currStepIDIndex = newStepIDData.stepIDs.length - 1;
                
                return newStepIDData;
            })

            setError(undefined)
            setParamsNotApplied(false);
            // TODO: change the type here
            return resultOrError;
        }
    }


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
            setParamsNotApplied(true);
        }

        // If we undo or redo, we know we are going to a valid configuration, in which
        // case we clear the error. Note that errors do play a little wacky with undo/redo,
        // as the parameters for errored configurations are _not_ saved (as they don't 
        // lead to valid steps). But it's fine!
        setError(undefined);
    }

    const refreshOnRedo = async () => {
        
        // Get the step id
        const stepID = stepIDData.stepIDs[stepIDData.currStepIDIndex + 1];

        // First, we need to bump the current step id index
        setStepIDData(prevStepIDData => {
            const newStepIDData = {stepIDs: [...prevStepIDData.stepIDs], currStepIDIndex: prevStepIDData.currStepIDIndex};
            newStepIDData.currStepIDIndex += 1;
            return newStepIDData;
        })

        console.log("Refreshing on redo with step id", stepID)

        const newParams = await mitoAPI.getParams<typeof defaultParams>(stepType, stepID, {});
        if (newParams !== undefined) {
            _setParams(newParams);
            // If we redo successfully, we also need to mark this as _nothing new_ so that
            // clicking the button does not reapply again
            setParamsNotApplied(false);
        }

        // If we undo or redo, we know we are going to a valid configuration, in which
        // case we clear the error. Note that errors do play a little wacky with undo/redo,
        // as the parameters for errored configurations are _not_ saved (as they don't 
        // lead to valid steps). But it's fine!
        setError(undefined);        
    }

    return {
        params: params,
        setParams: setParams,
        error: error,
        loading: loading,
        edit: edit,
        editApplied: !paramsNotApplied,
        result: paramsNotApplied ? undefined : (analysisData.lastResult as ResultType) 
        // TODO: make this sure this is the right step by checking the step type... this makes sense!
    }
}

export default useSendEditOnClick;