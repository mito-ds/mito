// Copyright (c) Mito

import { MitoError } from "../../types";

export enum ModalEnum {
    None = 'None',
    Error = 'Error',
    ClearAnalysis = 'ClearAnalysis',
    Import = "Import",
    SignUp = "SignUp",
    DashboardSignup = "DashboardSignup",
    Upgrade = 'Upgrade',
    Feedback = 'Feedback',
    DeleteGraphs = 'DeleteGraphs',
    ErrorReplayedAnalysis = 'ErrorReplayAnalysis',
    GraphTitleEditor = 'GraphTitleEditor',
    UserEditedCode = 'UserEditedCode',
}

/* 
    Each modal comes with modal info, and we enforce (through types) that if you set
    the current modal, you must also pass it the data that it requires. 

    To see what information a modal requires, see it's <>ModalInfo type definition
    below!

    NOTE: Currently, the column header modal is the only modal that needs any data...
    but this is a good investment for the future :)
*/
interface NoneModalInfo {type: ModalEnum.None}
interface ErrorModalInfo {
    type: ModalEnum.Error;
    error: {
        error: string,
        errorShort: string,
        traceback?: string
    }
}
export interface UserEditedCodeModalInfo {
    type: ModalEnum.UserEditedCode;
    oldCode: string[];
    newCode: string[];
}
interface SignUpModalInfo {
    type: ModalEnum.SignUp;
}
interface StreamlitSignUpModalInfo {
    type: ModalEnum.DashboardSignup;
}


interface ClearAnalysisInfo {
    type: ModalEnum.ClearAnalysis;
}
interface ErrorReplayedAnalysisInfo {
    type: ModalEnum.ErrorReplayedAnalysis;
    header: string,
    message: string,
    error: MitoError | undefined;
    oldAnalysisName: string;
    newAnalysisName: string;
}

interface DeleteGraphsModalInfo {
    type: ModalEnum.DeleteGraphs;
    sheetIndex: number;
    dependantGraphTabNamesAndIDs: {
        graphTabName: string;
        graphID: string;
    }[]
}

export type ModalInfo = 
    | NoneModalInfo 
    | ErrorModalInfo
    | UserEditedCodeModalInfo
    | SignUpModalInfo
    | ClearAnalysisInfo
    | DeleteGraphsModalInfo
    | ErrorReplayedAnalysisInfo
    | StreamlitSignUpModalInfo
