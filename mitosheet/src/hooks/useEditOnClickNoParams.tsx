import { useState } from "react";
import MitoAPI, { getRandomId } from "../jupyter/api";
import { AnalysisData } from "../types";
import { isMitoError } from "../utils/errors";
import { useEffectOnRedo } from "./useEffectOnRedo";
import { useEffectOnUndo } from "./useEffectOnUndo";
import { useEffectOnEdit } from "./useEffectOnEdit";

/* 
    This custom hook is built for taskpanes that have params that do not need to be stored
    before they are sent. 

    For example, the AI Transformation taskpane has a button that sends a message to the backend
    to apply an edit.

    Furthermore, this hook lets you send multiple edits in a row, and then undo and redo them. It
    gives you access to all params and all results of all edits that have been applied through
    this hook.
*/
function useSendEditOnClickNoParams<ParamType, ResultType>(
    stepType: string,
    mitoAPI: MitoAPI,
    analysisData: AnalysisData,
): {
        edit: (params: ParamType) => Promise<void>, // This function actually sends the edit message to the backend
        previousParamsAndResults: {params: ParamType, results: ResultType}[]; // All params that have been applied through this hook successfully, and their results
        error: string | undefined, // The error that was thrown when the last edit was applied (if any)
        loadingParams?: ParamType // If set, then these params are currently loading
    } {

    const [error, setError] = useState<string | undefined>(undefined);
    const [loadingParams, setLoadingParams] = useState<ParamType | undefined>(undefined);
    const [previousParams, setPreviousParams] = useState<ParamType[]>([]);
    const [results, setResults] = useState<ResultType[]>([]);

    const [currParamsIndex, setCurrParamsIndex] = useState(0);

    useEffectOnUndo(() => {
        void refreshOnUndo()
    }, analysisData)

    useEffectOnRedo(() => {
        void refreshOnRedo();
    }, analysisData)

    // NOTE: all edit events are the name of the step + _edit
    const editEvent = stepType + '_edit';

    // This function actually sends the edit message to the backend
    const edit = async (params: ParamType) => {

        setLoadingParams(params);
        setError(undefined);

        let newStepID = getRandomId();
        const possibleError = await mitoAPI._edit<ParamType>(editEvent, params, newStepID);

        setLoadingParams(undefined);

        // Handle if we return an error
        if (isMitoError(possibleError)) {
            setError(possibleError.to_fix);
        } else {
            // Update the params and results to clear anything later than then current params index
            const newParamsIndex = currParamsIndex + 1;
            setPreviousParams(prevPreviousParams => prevPreviousParams.slice(0, newParamsIndex));
            setResults(prevResults => prevResults.slice(0, newParamsIndex));
            setCurrParamsIndex(newParamsIndex);

            // Clear the error, and save the params
            setError(undefined)
            setPreviousParams(prevPreviousParams => [...prevPreviousParams, params]);

        }
    }

    const refreshOnUndo = async () => {
        console.log("REFRESH ON UNDO")

        // First, we need to knock back the current step id index
        setCurrParamsIndex(prevCurrStepIDIndex => prevCurrStepIDIndex - 1);

        // We also clear the error in this case, as this clearly was effectively applied
        setError(undefined);
    }

    const refreshOnRedo = async () => {
        // First, we need to increase the current step id index
        setCurrParamsIndex(prevCurrStepIDIndex => prevCurrStepIDIndex + 1);

        // Also clear the error
        setError(undefined);        
    }

    // When we do a successful edit, then get the new result
    useEffectOnEdit(() => {
        if (analysisData.stepSummaryList[analysisData.stepSummaryList.length - 1].step_type === stepType) {
            const result = analysisData.lastResult as ResultType;
            setResults(prevResults => [...prevResults, result]);
        }
    }, analysisData)




    // Zip previousParams and results together
    const previousParamsAndResults = previousParams.map((param, index) => {
        return {
            params: param,
            results: results[index]
        }
    }).splice(0, currParamsIndex);

    return {
        edit,
        previousParamsAndResults,
        error,
        loadingParams
    }
}

export default useSendEditOnClickNoParams;