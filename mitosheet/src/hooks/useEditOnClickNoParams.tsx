import { useState } from "react";
import MitoAPI, { getRandomId } from "../jupyter/api";
import { AnalysisData } from "../types";
import { isMitoError } from "../utils/errors";
import { useEffectOnEdit } from "./useEffectOnEdit";
import { useEffectOnRedo } from "./useEffectOnRedo";
import { useEffectOnUndo } from "./useEffectOnUndo";

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
        edit: (params: ParamType) => Promise<string | undefined>, // This function actually sends the edit message to the backend. Returns an error or undefined if no error
        previousParamsAndResults: {params: ParamType, results: ResultType}[]; // All params that have been applied through this hook successfully, and their results
    } {

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

        let newStepID = getRandomId();
        const possibleError = await mitoAPI._edit<ParamType>(editEvent, params, newStepID);

        // Handle if we return an error
        if (isMitoError(possibleError)) {
            return possibleError.to_fix;
        } else {
            // Update the params and results to clear anything later than then current params index
            const newParamsIndex = currParamsIndex + 1;
            setPreviousParams(prevPreviousParams => prevPreviousParams.slice(0, newParamsIndex));
            setResults(prevResults => prevResults.slice(0, newParamsIndex));
            setCurrParamsIndex(newParamsIndex);

            // Save the params
            setPreviousParams(prevPreviousParams => [...prevPreviousParams, params]);
            return undefined;
        }
    }

    const refreshOnUndo = async () => {
        setCurrParamsIndex(prevCurrStepIDIndex => prevCurrStepIDIndex - 1);
    }

    const refreshOnRedo = async () => {
        setCurrParamsIndex(prevCurrStepIDIndex => prevCurrStepIDIndex + 1);     
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
33
    return {
        edit,
        previousParamsAndResults,
    }
}

export default useSendEditOnClickNoParams;