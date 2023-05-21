/**
 * Sending a message is just an operation that receives a response.
 * 
 * We wrap comms in a send wrapper, so that when we go to places that 
 * don't have comms we don't need to worry about on messages, etc.
 * 
 */

import { AnalysisData, SheetData, UserProfile } from "../types";

export type SendFunctionSuccessReturnType<ResultType> = {
    sheetDataArray: SheetData[] | undefined,
    analysisData: AnalysisData | undefined,
    userProfile: UserProfile | undefined,
    result: ResultType
};

export type SendFunctionErrorReturnType = {
    error: string,
    errorShort: string,
    showErrorModal: boolean,
    traceback?: string,
};

export type SendFunctionReturnType<ResultType> =  SendFunctionSuccessReturnType<ResultType> | SendFunctionErrorReturnType;
export type SendFunction = <ResultType>(params: Record<string, unknown>) => Promise<SendFunctionReturnType<ResultType>>;