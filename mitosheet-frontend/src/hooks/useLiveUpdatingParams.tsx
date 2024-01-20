import React, { useCallback, useState } from "react";
import { MitoAPI,  getRandomId } from "../api/api";
import { AnalysisData, SheetData } from "../types";
import { useDebouncedEffect } from "./useDebouncedEffect";
import { useEffectOnUpdateEvent } from "./useEffectOnUpdateEvent";

/* 
    This is the first really cool custom hook. Generally, it allows you 
    to take some UI element and syncronize the parameters it has for an
    edit event to the backend. 

    If you pass this event default parameters, the stepType you are creating,
    and the edit event to create that step type, then this hook will:

    1. Give you access to [param, setParam] state setters.
    2. Automatically watch for undo/redo, and refresh params in that case.
    3. Send messages when the params are updated (ignoring undo/redo updates)
    4. Return errors if errors are returned that are not meant to be displayed
       in the error modal are returned.

    See ConcatTaskpane for how this is used. In general, it allows us to
    take the custom UI code we have to write down to _just_ the code to display
    the parameters to the user and allow them to edit them. This is really
    sweet, and we'll continue to migrate to this hook over time. Woo!

    We allow consumers of this hook to have a different type of frontend
    params from backend params (as long as they pass functions to convert
    between them), as in some cases (e.g. pivot), what is useful on the 
    backend is different than what is useful on the frontend.
*/
function useLiveUpdatingParams<FrontendParamType, BackendParamType>(
    // Params to represent what should be shown when we open the taskpane and are by default send to the backend
    defaultParams: FrontendParamType | undefined | (() => FrontendParamType | undefined),
    stepType: string,
    mitoAPI: MitoAPI,
    analysisData: AnalysisData,
    debounceDelay: number,
    // Functions to update params when passed between frontend and backend. 
    frontendToBackendConverters?: {
        getBackendFromFrontend: (params: FrontendParamType, sheetDataArray?: SheetData[]) => BackendParamType,
        getFrontendFromBackend: (params: BackendParamType, sheetDataArray?: SheetData[]) => FrontendParamType,
    },
    options?: {
        doNotSendDefaultParams: boolean,
    },
    sheetDataArray?: SheetData[]
): {
        params: FrontendParamType | undefined, // If this is undefined, no messages will be sent to the backend
        setParams: React.Dispatch<React.SetStateAction<FrontendParamType>>, 
        error: string | undefined,
        loading: boolean, // This loading indicator is for if the edit message is processing
        startNewStep: () => void, // Allows the consumer of this hook to start a new live updating step
    } {

    const [params, _setParams] = useState<FrontendParamType | undefined>(defaultParams);
    const [updateNumber, setUpdateNumber] = useState(0);
    const [stepID, setStepID] = useState<string>(() => getRandomId());
    const [error, setError] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(false);

    // TODO: Explain these well
    const converters = frontendToBackendConverters || {
        getBackendFromFrontend: (p: FrontendParamType) => {return (p as unknown) as BackendParamType},
        getFrontendFromBackend: (p: BackendParamType) => {return (p as unknown) as FrontendParamType},
    }

    useDebouncedEffect(() => {
        void onChange()
    }, [updateNumber], debounceDelay)

    useEffectOnUpdateEvent(() => {
        void refreshParams();
    }, analysisData)

    // NOTE: all edit events are the name of the step + _edit
    const editEvent = stepType + '_edit';

    // We wrap the _setParams call we use internally, so that when the consumer
    // of the setParams function outside of this hook calls it, we automatically
    // update the updateNumber by one, which allows a message to get sent to the
    // backend. This makes life very plesant for the consumer of this hook, as 
    // they don't have to remember to increment a setUpdateNumber state variable
    // by one every time they change the params
    const setParams: React.Dispatch<React.SetStateAction<FrontendParamType>> = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (args: any) => {
            _setParams(args);
            setUpdateNumber(old => old + 1)
        },
        [],
    );

    const onChange = async () => {
        // Do not send an edit message if the params are undefined
        if (params === undefined) {
            return;
        }
        // Do not send the default params if told not to
        if (options?.doNotSendDefaultParams === true && updateNumber === 0) {
            return;
        }

        // Convert the frontend params to the backend params
        const finalParams = converters.getBackendFromFrontend(params, sheetDataArray);

        setLoading(true);
        const possibleError = await mitoAPI._edit<BackendParamType>(editEvent, finalParams, stepID);
        setLoading(false);

        // Handle if we return an error
        if ('error' in possibleError) {
            setError(possibleError.error);
        } else {
            setError(undefined)
        }
    }

    const refreshParams = async (): Promise<void> => {

        // Get the steps with this step ID
        const steps = analysisData.stepSummaryList.filter(step => step.step_type === stepType);

        // If there are no steps with this ID, then set the default IDs        
        if (steps.length === 0) {
            _setParams(defaultParams);
        } else {
            // Otherwise, we get the last step and set the params to that
            const lastStep = steps[steps.length - 1];
            const newBackendParams = lastStep.params as BackendParamType;
            _setParams(converters.getFrontendFromBackend(newBackendParams, sheetDataArray));
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
        startNewStep: () => {setStepID(getRandomId());}
    }
}

export default useLiveUpdatingParams;