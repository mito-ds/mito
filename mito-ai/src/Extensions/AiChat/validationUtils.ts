


/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { AgentResponse } from '../../websockets/completions/CompletionModels';

/**
 * Validates and corrects an AgentResponse to ensure it adheres to the expected format.
 * Handles common mistakes like string instead of array, missing fields, etc.
 */
export function validateAndCorrectAgentResponse(agentResponse: AgentResponse): AgentResponse {
    // Create a copy to avoid mutating the original
    const correctedResponse: AgentResponse = { ...agentResponse };
    
    // Ensure type is valid. Default to finished_task if not valid.
    const validTypes = ['cell_update', 'get_cell_output', 'run_all_cells', 'finished_task', 'create_streamlit_app', 'edit_streamlit_app'];
    correctedResponse.type = (correctedResponse.type && validTypes.includes(correctedResponse.type)) 
        ? correctedResponse.type 
        : 'finished_task';
    
    // Ensure message is a string. Default to empty string if not valid.
    if (!correctedResponse.message || typeof correctedResponse.message !== 'string') {
        correctedResponse.message = '';
    }
    
    // Correct get_cell_output_cell_id if present
    const getCellOutputCellIdType = typeof correctedResponse.get_cell_output_cell_id;
    correctedResponse.get_cell_output_cell_id = getCellOutputCellIdType === 'string' ? correctedResponse.get_cell_output_cell_id : undefined;
    
    // Correct next_steps - handle string to array conversion
    if (correctedResponse.next_steps !== undefined && correctedResponse.next_steps !== null) {
        correctedResponse.next_steps = correctStringArray(correctedResponse.next_steps);
    }
    
    // Correct analysis_assumptions - handle string to array conversion
    if (correctedResponse.analysis_assumptions !== undefined && correctedResponse.analysis_assumptions !== null) {
        
        correctedResponse.analysis_assumptions = correctStringArray(correctedResponse.analysis_assumptions);

        // No empty strings in the assumptions
        correctedResponse.analysis_assumptions = correctedResponse.analysis_assumptions?.filter(assumption => assumption.trim() !== '')
    }

    // Correct edit_streamlit_app_prompt - ensure it's a string when present
    const editStreamlitAppPromptType = typeof correctedResponse.edit_streamlit_app_prompt;
    correctedResponse.edit_streamlit_app_prompt = editStreamlitAppPromptType === 'string' ? correctedResponse.edit_streamlit_app_prompt : undefined;

    // For now we don't validate the cell_update object itself, as this is more complex and has 
    // not caused issues thus far.
    return correctedResponse;
}


/**
 * Corrects a value to be a string array, handling various input formats.
 * Handles cases where the AI returns a string instead of an array of strings.
 */
function correctStringArray(value: any): string[] | undefined {
    // If it's already a valid array of strings, return it
    if (Array.isArray(value)) {
        return value 
    }

    if (typeof value === 'string') {
        return [value];
    }
    
    return undefined;
}