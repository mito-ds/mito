import {UserDefinedFunctionParamNameToType, UserDefinedFunctionParamType, SheetData} from '../types';

export const getInitialEmptyParameters = (
    sheetDataArray: SheetData[], 
    paramNameToType: UserDefinedFunctionParamNameToType,
): Record<string, string> => {

    return Object.fromEntries(Object.entries(paramNameToType).map(([paramName, paramType]) => {

        if (paramType == 'pd.DataFrame') {
            const sheetData = sheetDataArray[0];
            if (sheetData !== undefined) {
                return [paramName, sheetData.dfName]
            }
        }

        return [paramName, '']})
    )
}

export const getParamTypeDisplay = (
    paramType: UserDefinedFunctionParamType
): string | undefined => {
    if (paramType === 'str') {
        return 'string'
    } else if (paramType == 'float') {
        return 'float'
    } else if (paramType == 'int') {
        return 'int'
    } else if (paramType == 'bool') {
        return 'bool'
    } else {
        return undefined;
    }
}

export const getDisplayNameOfPythonVariable = (pythonVariableName: string) => {
    return pythonVariableName.replace('_', ' ').split(' ').filter(w => w.length > 0).map(w => w[0].toUpperCase() + w.substring(1)).join(' ');
}