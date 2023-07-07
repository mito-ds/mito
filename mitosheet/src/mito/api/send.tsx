/**
 * Sending a message is just an operation that receives a response.
 * 
 * We wrap comms in a send wrapper, so that when we go to places that 
 * don't have comms we don't need to worry about on messages, etc.
 * 
 */

export const MAX_WAIT_FOR_SEND_CREATION = 10_000;

export type SendFunctionError = 'non_working_extension_error' | 'no_backend_comm_registered_error' | 'non_valid_location_error';
export type SendFunctionStatus = 'loading' | 'finished' | SendFunctionError;

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
export type SendFunction = <ResultType>(msg: Record<string, unknown>) => Promise<SendFunctionReturnType<ResultType>>;