import { convertBackendtoFrontendGraphParams } from './components/taskpanes/Graph/graphUtils';
import { AnalysisData, GraphDataBackend, GraphDataDict, GraphParamsBackend, SheetData, UserProfile } from './types';

export { Mito } from './Mito';
export {
    AnalysisData, GraphDataBackend, GraphDataDict, GraphParamsBackend, MitoEnterpriseConfigKey, MitoTheme, PublicInterfaceVersion, SheetData, StepType, UserProfile
} from "./types";

export { MitoAPI, MitoResponse } from './api/api';
export { MAX_WAIT_FOR_SEND_CREATION, SendFunction, SendFunctionError, SendFunctionReturnType } from "./api/send";

export { waitUntilConditionReturnsTrueOrTimeout } from "./utils/time";

export { convertBackendtoFrontendGraphParams } from "./components/taskpanes/Graph/graphUtils";
export { isInJupyterLab, isInJupyterNotebook } from './utils/location';


export { MITO_TOOLBAR_OPEN_SEARCH_ID, MITO_TOOLBAR_REDO_ID, MITO_TOOLBAR_UNDO_ID } from './components/toolbar/Toolbar';
export { containsGeneratedCodeOfAnalysis, containsMitosheetCallWithAnyAnalysisToReplay, containsMitosheetCallWithSpecificAnalysisToReplay, getArgsFromMitosheetCallCode, getCodeString, getLastNonEmptyLine, isMitosheetCallCode, removeWhitespaceInPythonCode } from './utils/code';

export { getOperatingSystem, keyboardShortcuts } from './utils/keyboardShortcuts';

export { getRandomId } from './api/api';




export const getSheetDataArrayFromString = (sheet_data_json: string): SheetData[] => {
    if (sheet_data_json.length === 0) {
        return []
    }
    return JSON.parse(sheet_data_json);
}

export const getUserProfileFromString = (user_profile_json: string): UserProfile => {
    const userProfile = JSON.parse(user_profile_json)
    if (userProfile['usageTriggeredFeedbackID'] == '') {
        userProfile['usageTriggeredFeedbackID'] = undefined
    }
    return userProfile;
}
export const getAnalysisDataFromString = (analysis_data_json: string): AnalysisData =>  {
    const parsed = JSON.parse(analysis_data_json)

    // Convert the graphData from backend to frontend form.
    const graphDataDict: GraphDataDict = {} 
    Object.entries(parsed['graphDataDict']).map(([graphID, graphDataBackend]) => {
        const graphDataBackendTyped = graphDataBackend as GraphDataBackend
        const graphParamsBackend: GraphParamsBackend = graphDataBackendTyped['graphParams']
        const graphParamsFrontend = convertBackendtoFrontendGraphParams(graphParamsBackend)
        graphDataDict[graphID] = {
            ...graphDataBackendTyped,
            graphParams: graphParamsFrontend
        }
    })

    parsed['graphDataDict'] = graphDataDict;
    return parsed;
}

export { MitoFlask } from './MitoFlask';