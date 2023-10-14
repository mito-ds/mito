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
    const words = pythonVariableName.replace(/_/g, ' ').split(' ');

    return words.map(word => {
        if (word.length <= 1) {
            return word;
        }
        
        return word[0].toUpperCase() + word.substring(1)
    }).join(' ');
}