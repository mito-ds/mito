import {UserDefinedFunctionParamNameToType, UserDefinedFunctionParamType, SheetData} from '../types';

export const getInitialEmptyParameters = (
    sheetDataArray: SheetData[], 
    paramNameToType: UserDefinedFunctionParamNameToType,
): Record<string, string> => {

    let previousSheetData: SheetData | undefined = undefined;
    return Object.fromEntries(Object.entries(paramNameToType).map(([paramName, paramType]) => {


        if (paramType == 'pd.DataFrame') {
            const sheetData = sheetDataArray[0];
            previousSheetData = sheetData;
            if (sheetData !== undefined) {
                return [paramName, sheetData.dfName]
            }
        } else if (paramType === 'ColumnHeader') {
            const firstColumnID = Object.keys(previousSheetData?.columnIDsMap || {'': ''})[0]
            return [paramName, firstColumnID]
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
    } else if (paramType == 'pd.DataFrame') {
        return 'Pandas Dataframe'
    } else if (paramType == 'ColumnHeader') {
        return 'Pandas Dataframe Column Header'
    } else {
        return undefined;
    }
}

export const getDisplayNameOfPythonVariable = (pythonVariableName: string) => {
    // We handle some common Python variable naming conventions
    if (pythonVariableName === 'df') {
        return 'Dataframe';
    }
    
    const words = pythonVariableName.replace(/_/g, ' ').split(' ');


    return words.map(word => {
        if (word.length <= 1) {
            return word;
        }
        
        return word[0].toUpperCase() + word.substring(1)
    }).join(' ');
}