/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { ICellModel } from "@jupyterlab/cells";

// Helper function to get cell content
export const getCellContent = (cell: ICellModel): string => {
    return cell.sharedModel.source;
};

// Helper function to get cell type
export const getCellType = (cell: ICellModel): string => {
    return cell.type;
};

const getVariableNameDefaultAndLabel = (line: string, identifier: string): [string, string, string] => {
    // Split on the equal sign to get the variable name. We must use this full
    // name because its what the python script uses. 
    const variableName = line.split(' ')[0]?.trim() || ''

    // Split on the identifier to get the unique label for this variable
    let variableLabel = variableName?.split(identifier)[1] || ''

    if (variableLabel.startsWith("_")) {
        variableLabel = variableLabel.slice(1)
    }

    // Get the value after the equal sign to get the default value for the variable
    const defaultValue = line.split('=')[1]?.trim() || ''

    return [variableName, variableLabel, defaultValue]
}

export const transformMitoAppInput = (line: string): string => {

    const textInputIdentifer = 'mito_app_text_input'
    if (line.startsWith(textInputIdentifer)) {
        const [variableName, variableLabel, defaultValue] = getVariableNameDefaultAndLabel(line, textInputIdentifer)
        return `${variableName} = st.text_input('${variableLabel}', ${defaultValue})`
    }

    const numberInputIdentifier = 'mito_app_number_input'
    if (line.startsWith(numberInputIdentifier)) {
        const [variableName, variableLabel, defaultValue] = getVariableNameDefaultAndLabel(line, numberInputIdentifier)
        return `${variableName} = st.number_input('${variableLabel}', ${defaultValue})`
    }

    const dateInputIdentifier = 'mito_app_date_input'
    if (line.startsWith(dateInputIdentifier)) {
        const [variableName, variableLabel, defaultValue] = getVariableNameDefaultAndLabel(line, dateInputIdentifier)

        // The user is responsible for making sure the right hand side is a valid option:
        // "today", datetime.date, datetime.datetime, "YYYY-MM-DD". 
        return `${variableName} = st.date_input('${variableLabel}', ${defaultValue})`
    }

    const booleanInputIdentifier = 'mito_app_boolean_input'
    if (line.startsWith(booleanInputIdentifier)) {
        const [variableName, variableLabel, defaultValue] = getVariableNameDefaultAndLabel(line, booleanInputIdentifier)
        return `${variableName} = st.checkbox('${variableLabel}', ${defaultValue})`
    }

    // If there was no text_input to create, then just return the original line.
    return line
}

export const removeInvalidLines = (cellContent: string): string => {
    // Remove lines that are special to ipython and won't work in streamlit. These lines start with:
    // ! -> like !pip install pandas
    // % -> like %pip install pandas
    // %% -> like %%pip install pandas
    const invalidLinesPrefixes = ['!', '%', '%%']
    return cellContent.split('\n').filter(line => !invalidLinesPrefixes.some(prefix => line.trim().startsWith(prefix))).join('\n')
}