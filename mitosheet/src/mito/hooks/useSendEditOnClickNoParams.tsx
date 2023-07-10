import { MitoAPI,  getRandomId } from "../api/api";
import { AnalysisData, StepType } from "../types";

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
    stepType: StepType,
    mitoAPI: MitoAPI,
    analysisData: AnalysisData,
): {
        edit: (params: ParamType) => Promise<string | undefined>, // This function actually sends the edit message to the backend. Returns an error or undefined if no error
        previousParamsAndResults: {params: ParamType, results: ResultType}[]; // All params that have been applied through this hook successfully, and their results
    } {
    // NOTE: all edit events are the name of the step + _edit
    const editEvent = stepType + '_edit';

    // This function actually sends the edit message to the backend
    const edit = async (params: ParamType) => {

        const newStepID = getRandomId();
        const possibleError = await mitoAPI._edit<ParamType>(editEvent, params, newStepID);

        // Handle if we return an error
        if ('error' in possibleError) {
            return possibleError.error;
        } 
    }

    // Get the previous params and results from the analysis data, and zip them together
    const steps = analysisData.stepSummaryList.filter(step => step.step_type === stepType);
    const previousParamsAndResults = steps.map((step) => {
        return {
            params: step.params as ParamType,
            results: step.result as ResultType
        }
    })

    return {
        edit,
        previousParamsAndResults,
    }
}

export default useSendEditOnClickNoParams;