


/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { AgentResponse, AnalysisAssumptionOptions } from '../../websockets/completions/CompletionModels';

/**
 * Validates and corrects an AgentResponse to ensure it adheres to the expected format.
 * Handles common mistakes like string instead of array, missing fields, etc.
 */
export function validateAndCorrectAgentResponse(agentResponse: AgentResponse): AgentResponse {
    // Create a copy to avoid mutating the original
    const correctedResponse: AgentResponse = { ...agentResponse };
    
    // Ensure type is valid. Default to finished_task if not valid.
    const validTypes = [
        'cell_update', 
        'get_cell_output', 
        'run_all_cells', 
        'ask_user_question',
        'finished_task', 
        'create_streamlit_app', 
        'edit_streamlit_app',
        'scratchpad',
        'read_skill',
        'read_verified_report',
    ];
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

    // Correct ask_user_question
    if (correctedResponse.answers !== undefined && correctedResponse.answers !== null) {
        correctedResponse.answers = correctStringArray(correctedResponse.answers);
    }
    if (correctedResponse.type === 'ask_user_question' && typeof correctedResponse.question !== 'string') {
        correctedResponse.question = ""
    }
    
    // Correct analysis_assumptions - coerce legacy strings and validate structured objects
    if (correctedResponse.analysis_assumptions !== undefined && correctedResponse.analysis_assumptions !== null) {
        correctedResponse.analysis_assumptions = correctAnalysisAssumptions(correctedResponse.analysis_assumptions);
    }

    // Correct streamlit_app_prompt - ensure it's a string when present
    const editStreamlitAppPromptType = typeof correctedResponse.streamlit_app_prompt;
    correctedResponse.streamlit_app_prompt = editStreamlitAppPromptType === 'string' ? correctedResponse.streamlit_app_prompt : undefined;

    // Correct scratchpad_code and scratchpad_summary - ensure they're strings when present
    if (correctedResponse.type === 'scratchpad') {
        const scratchpadCodeType = typeof correctedResponse.scratchpad_code;
        correctedResponse.scratchpad_code = scratchpadCodeType === 'string' ? correctedResponse.scratchpad_code : undefined;
        
        const scratchpadSummaryType = typeof correctedResponse.scratchpad_summary;
        correctedResponse.scratchpad_summary = scratchpadSummaryType === 'string' ? correctedResponse.scratchpad_summary : undefined;
    }

    if (correctedResponse.type === 'read_verified_report') {
        const verifiedReportNameType = typeof correctedResponse.verified_report_name;
        correctedResponse.verified_report_name = verifiedReportNameType === 'string'
            ? correctedResponse.verified_report_name
            : undefined;
    }

    // Correct verified_snippet_ref - drop it unless it has the expected shape
    if (correctedResponse.verified_snippet_ref !== undefined && correctedResponse.verified_snippet_ref !== null) {
        const ref = correctedResponse.verified_snippet_ref;
        const isValid = typeof ref === 'object'
            && typeof ref.report_name === 'string'
            && typeof ref.snippet_id === 'string'
            && typeof ref.start_line === 'number'
            && typeof ref.end_line === 'number';
        correctedResponse.verified_snippet_ref = isValid ? ref : undefined;
    }

    // For now we don't validate the cell_update object itself, as this is more complex and has 
    // not caused issues thus far.
    return correctedResponse;
}


/**
 * Corrects a value to be a string array, handling various input formats.
 * Handles cases where the AI returns a string instead of an array of strings.
 */
/**
 * Coerces analysis_assumptions into a valid AnalysisAssumptionOptions array.
 * Handles legacy formats (string or string[] from old chat histories on disk) by
 * converting each string into a single-option assumption, and enforces the
 * selected-in-options invariant on structured objects.
 */
function correctAnalysisAssumptions(value: any): AnalysisAssumptionOptions[] | undefined {
    const items = Array.isArray(value) ? value : [value];
    const corrected: AnalysisAssumptionOptions[] = [];

    for (const item of items) {
        if (typeof item === 'string') {
            // Legacy format: a plain string assumption with no alternatives
            if (item.trim() !== '') {
                corrected.push({ selected: item, options: [item] });
            }
        } else if (item !== null && typeof item === 'object' && typeof item.selected === 'string' && item.selected.trim() !== '') {
            const options = correctStringArray(item.options)?.filter(option => typeof option === 'string' && option.trim() !== '') ?? [];

            // Enforce the invariant that selected appears in options
            if (!options.includes(item.selected)) {
                options.unshift(item.selected);
            }

            corrected.push({
                selected: item.selected,
                options: options,
                evidence: typeof item.evidence === 'string' && item.evidence.trim() !== '' ? item.evidence : undefined
            });
        }
    }

    return corrected.length > 0 ? corrected : undefined;
}


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