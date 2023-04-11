import React from 'react';
import '../../../../css/endo/CellEditor.css';
import { EditorState, SheetData } from '../../../types';
import { classNames } from '../../../utils/classNames';
import { getDisplayColumnHeader } from '../../../utils/columnHeaders';
import LoadingDots from '../../elements/LoadingDots';
import Toggle from '../../elements/Toggle';
import Row from '../../layout/Row';
import { getCellDataFromCellIndexes } from '../utils';
import { formulaEndsInReference, getCellEditorWidth, getDocumentationFunction, getFullFormula, getSuggestedColumnHeaders, getSuggestedFunctions } from './cellEditorUtils';

export const MAX_SUGGESTIONS = 4;

const CellEditorDropdown = (props: {
    sheetData: SheetData,
    sheetIndex: number,
    editorState: EditorState,
    setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>,
    cellEditorError: string | undefined;
    loading: boolean;
    cellEditorInputRef: React.MutableRefObject<HTMLInputElement | HTMLTextAreaElement | null>
    selectedSuggestionIndex: number;
    setSavedSelectedSuggestionIndex: React.Dispatch<React.SetStateAction<number>>
}): JSX.Element => {

    const {columnID, columnHeader, indexLabel} = getCellDataFromCellIndexes(props.sheetData, props.editorState.rowIndex, props.editorState.columnIndex);

    if (columnID === undefined || columnHeader === undefined || indexLabel === undefined) {
        return <></>;
    }

    const fullFormula = getFullFormula(props.editorState.formula, props.editorState.pendingSelections, props.sheetData);
    const endsInReference = formulaEndsInReference(fullFormula, indexLabel, props.sheetData);

    const documentationFunction = getDocumentationFunction(fullFormula, props.cellEditorInputRef.current?.selectionStart);

    // NOTE: we get our suggestions off the non-full formula, as we don't want to make suggestions
    // for column headers that are pending currently
    const [suggestedColumnHeadersReplacementLength, suggestedColumnHeaders] = getSuggestedColumnHeaders(props.editorState.formula, columnID, props.sheetData);
    const [suggestedFunctionsReplacementLength, suggestedFunctions] = getSuggestedFunctions(props.editorState.formula, suggestedColumnHeadersReplacementLength);
    const hasSuggestions = suggestedColumnHeaders.length > 0 || suggestedFunctions.length > 0;

    // Helper function to take the suggestion at a given index
    const takeSuggestion = (suggestionIndex: number) => {
        // If no suggestion is selected, don't do anything
        if (suggestionIndex === -1) {
            return;
        }

        // If the user presses tab, and they are currently have a suggestion selected, then
        // we go ahead and take that suggestion
        let suggestionReplacementLength = 0;
        let suggestion = '';

        let isColumnHeaderSuggestion = true;
        if (suggestionIndex < suggestedColumnHeaders.length) {
            suggestionReplacementLength = suggestedColumnHeadersReplacementLength
            suggestion = suggestedColumnHeaders[suggestionIndex][0];
        } else {
            suggestionReplacementLength = suggestedFunctionsReplacementLength
            // We add a open parentheses onto the formula suggestion
            suggestion = suggestedFunctions[suggestionIndex - suggestedColumnHeaders.length][0] + '(';
            isColumnHeaderSuggestion = false;
        }

        // Get the full formula
        let fullFormula = getFullFormula(
            props.editorState.formula, 
            props.editorState.pendingSelections, 
            props.sheetData,
        );

        // Strip the prefix, and append the suggestion, and the current index label as well
        fullFormula = fullFormula.substr(0, fullFormula.length - suggestionReplacementLength);
        fullFormula += suggestion;
        if (isColumnHeaderSuggestion) {
            fullFormula += getDisplayColumnHeader(indexLabel);
        }

        // Update the cell editor state
        props.setEditorState({
            ...props.editorState,
            formula: fullFormula,
            pendingSelections: undefined,
            arrowKeysScrollInFormula: props.editorState.editorLocation === 'formula bar' ? true : false
        })

        // Make sure we jump to the end of the input, as we took the suggestion
        props.cellEditorInputRef.current?.setSelectionRange(
            fullFormula.length, fullFormula.length
        )
    }


    const formula = getFullFormula(props.editorState.formula, props.editorState.pendingSelections, props.sheetData)
    const cellEditorWidth = getCellEditorWidth(formula, props.editorState.editorLocation);
    const showingSuggestions = props.cellEditorError === undefined && !props.loading && !endsInReference && (suggestedColumnHeaders.length > 0 || suggestedFunctions.length > 0);

    return (
        <div className='cell-editor-dropdown-box' style={{width: `${cellEditorWidth}px`}}>
            {props.cellEditorError === undefined && props.editorState.rowIndex != -1 &&
                <Row justify='space-between' align='center' className='cell-editor-label'>
                    <p className={classNames('text-subtext-1', 'pl-5px', 'mt-2px')} title={props.editorState.editingMode === 'entire_column' ? 'You are currently editing the entire column. Setting a formula will change all values in the column.' : 'You are currently editing a specific cell. Changing this value will only effect this cell.'}>
                        Edit entire column
                    </p>
                    <Toggle
                        className='mr-5px'
                        value={props.editorState.editingMode === 'entire_column' ? true : false}
                        onChange={() => {
                            props.setEditorState(prevEditorState => {
                                if (prevEditorState === undefined) {
                                    return undefined
                                }
                                const prevEditingMode = {...prevEditorState}.editingMode
                                return {
                                    ...prevEditorState,
                                    editingMode: prevEditingMode === 'entire_column' ? 'specific_index_labels' : 'entire_column'
                                }
                            })
                        }}
                        height='20px'
                    />
                </Row>
            }
            {props.cellEditorError === undefined && props.editorState.rowIndex == -1 &&
                <p className={classNames('text-subtext-1', 'pl-5px', 'mt-2px')} title='You are currently editing the column header.'>
                    Edit column header
                </p>
            }
            {/* Show an error if there is currently an error */}
            {props.cellEditorError !== undefined &&
                <div className='cell-editor-error-container pl-10px pr-5px pt-5px pb-5px'>
                    <p className='text-body-1 text-color-error'>
                        {props.cellEditorError}
                    </p>
                    <p className='text-subtext-1'>
                        Press Escape to close the cell editor.
                    </p>
                </div>
            }
            {/* Show we're loading if we're currently loading */}
            {props.loading && 
                <p className='text-body-2 pl-5px'>
                    Processing<LoadingDots />
                </p>
            }
            {/* Show the suggestions */}
            {showingSuggestions &&
                <>
                    {(suggestedColumnHeaders.concat(suggestedFunctions)).map(([suggestion, subtext], idx) => {
                        // We only show at most 4 suggestions
                        if (idx > MAX_SUGGESTIONS) {
                            return <></>
                        }

                        const selected = idx === props.selectedSuggestionIndex;
                        const suggestionClassNames = classNames('cell-editor-suggestion', 'text-body-2', {
                            'cell-editor-suggestion-selected': selected
                        });
                        
                        return (
                            <div 
                                onMouseEnter={() => props.setSavedSelectedSuggestionIndex(idx)}
                                onClick={() => {
                                    // Take a suggestion if you click on it
                                    takeSuggestion(idx);
                                    // Make sure we're focused
                                    props.cellEditorInputRef.current?.focus();
                                }}
                                className={suggestionClassNames} 
                                key={suggestion}
                            >
                                <span className='text-overflow-hide' title={suggestion}>
                                    {suggestion}
                                </span>
                                {selected &&
                                    <div className={classNames('cell-editor-suggestion-subtext', 'text-subtext-1')}>
                                        {subtext}
                                    </div>
                                }
                            </div>
                        )
                    })}
                </>
            }
            {/* Otherwise, display the documentation function */}
            {props.cellEditorError === undefined && !props.loading && !hasSuggestions && documentationFunction !== undefined && props.editorState.pendingSelections === undefined &&
                <div>
                    <div className='cell-editor-function-documentation-header pt-5px pb-10px pl-10px pr-10px'>
                        <p className='text-body-2'>
                            {documentationFunction.syntax}
                        </p>
                        <p className='text-subtext-1'>
                            {documentationFunction.description}
                        </p>
                    </div>
                    <div className='pt-5px pb-10px pr-10px pl-10px'>
                        <p className='text-subtext-1'>
                            Examples
                        </p>
                        {documentationFunction.examples?.map((example, index) => {
                            return (
                                <p 
                                    key={index}
                                    className='cell-editor-function-documentation-example'
                                >
                                    {example}
                                </p>
                            )
                        })}
                    </div>
                </div>
            }
        </div>
    )
}

export default CellEditorDropdown;