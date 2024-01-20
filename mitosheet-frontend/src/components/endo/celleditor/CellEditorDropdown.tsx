import React from 'react';
import '../../../../css/endo/CellEditor.css';
import { FunctionDocumentationObject } from '../../../data/function_documentation';
import { AnalysisData, EditorState, SheetData } from '../../../types';
import { classNames } from '../../../utils/classNames';
import LoadingDots from '../../elements/LoadingDots';
import Toggle from '../../elements/Toggle';
import Row from '../../layout/Row';
import { getCellDataFromCellIndexes } from '../utils';
import { getCellEditorWidth, getDocumentationFunction, getFormulaEndsInReference, getFullFormula, getSuggestedColumnHeaders, getSuggestedFunctions } from './cellEditorUtils';

const FORMULA_DOC_LINK = 'https://docs.trymito.io/how-to/interacting-with-your-data/mito-spreadsheet-formulas';
export const MAX_SUGGESTIONS = 4;

type SuggestionDisplayDropdownType = {
    'type': 'suggestions',
    'suggestedColumnHeaders': [string, string][],
    'suggestedColumnHeadersReplacementLength': number,
    'suggestedFunctions': [string, string][],
    'suggestedFunctionsReplacementLength': number,
}

type DisplayedDropdownType = {
    'type': 'error',
    'error': string,
} | {
    'type': 'loading',
} | SuggestionDisplayDropdownType 
| {
    'type': 'documentation',
    'documentationFunction': FunctionDocumentationObject,
}


export const getDisplayedDropdownType = (
    sheetDataArray: SheetData[],
    sheetIndex: number,
    editorState: EditorState,
    selectionStart: number | null | undefined,
    cellEditorError: string | undefined,
    loading: boolean,
    analysisData: AnalysisData,
): DisplayedDropdownType | undefined => {

    const fullFormula = getFullFormula(editorState, sheetDataArray, sheetIndex);
    const sheetData = sheetDataArray[editorState.sheetIndex];
    const endsInReference = getFormulaEndsInReference(fullFormula, sheetData);


    // NOTE: we get our suggestions off the non-full formula, as we don't want to make suggestions
    // for column headers that are pending currently
    const [suggestedColumnHeadersReplacementLength, suggestedColumnHeaders] = getSuggestedColumnHeaders(editorState.formula, sheetData);
    const [suggestedFunctionsReplacementLength, suggestedFunctions] = getSuggestedFunctions(editorState.formula, suggestedColumnHeadersReplacementLength, analysisData);

    const documentationFunction = getDocumentationFunction(fullFormula, selectionStart, analysisData);

    if (cellEditorError !== undefined) {
        return {
            'type': 'error',
            'error': cellEditorError,
        };
    } else if (loading) {
        return {
            'type': 'loading',
        };
    } else if (!endsInReference && (suggestedColumnHeaders.length > 0 || suggestedFunctions.length > 0)) {
        return {
            'type': 'suggestions',
            'suggestedColumnHeaders': suggestedColumnHeaders,
            'suggestedColumnHeadersReplacementLength': suggestedColumnHeadersReplacementLength,
            'suggestedFunctions': suggestedFunctions,
            'suggestedFunctionsReplacementLength': suggestedFunctionsReplacementLength,
        };
    } else if (documentationFunction !== undefined) {
        return {
            'type': 'documentation',
            'documentationFunction': documentationFunction,
        };
    }

    return undefined;
}

const CellEditorDropdown = (props: {
    sheetDataArray: SheetData[],
    sheetIndex: number,
    editorState: EditorState,
    setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>,
    cellEditorInputRef: React.MutableRefObject<HTMLInputElement | HTMLTextAreaElement | null>
    selectedSuggestionIndex: number;
    setSavedSelectedSuggestionIndex: React.Dispatch<React.SetStateAction<number>>,
    displayedDropdownType: DisplayedDropdownType | undefined,
    takeSuggestion: (idx: number) => void,
}): JSX.Element => {
    const sheetData = props.sheetDataArray[props.sheetIndex];
    const {columnID, columnHeader, indexLabel} = getCellDataFromCellIndexes(sheetData, props.editorState.rowIndex, props.editorState.columnIndex);

    if (columnID === undefined || columnHeader === undefined || indexLabel === undefined) {
        return <></>;
    }

    const displayedDropdownType = props.displayedDropdownType;

    const formula = getFullFormula(props.editorState, props.sheetDataArray, props.sheetIndex)
    const cellEditorWidth = getCellEditorWidth(formula, props.editorState.editorLocation);

    return (
        <div className='cell-editor-dropdown-box' style={{width: `${cellEditorWidth}px`}}>
            {displayedDropdownType?.type !== 'error' && props.editorState.rowIndex != -1 &&
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
            {displayedDropdownType?.type !== 'error' && props.editorState.rowIndex == -1 &&
                <p className={classNames('text-subtext-1', 'pl-5px', 'mt-2px')} title='You are currently editing the column header.'>
                    Edit column header
                </p>
            }
            {/* Show an error if there is currently an error */}
            {displayedDropdownType?.type === 'error' &&
                <div className='cell-editor-error-container pl-10px pr-5px pt-5px pb-5px'>
                    <p className='text-body-1 text-color-error'>
                        {displayedDropdownType.error}
                    </p>
                    <p className='text-subtext-1'>
                        Press Escape to close the cell editor.
                    </p>
                </div>
            }
            {/* Show we're loading if we're currently loading */}
            {displayedDropdownType?.type === 'loading' && 
                <p className='text-body-2 pl-5px'>
                    Processing<LoadingDots />
                </p>
            }
            {/* Show the suggestions */}
            {displayedDropdownType?.type === 'suggestions' &&
                <>
                    {(displayedDropdownType.suggestedColumnHeaders.concat(displayedDropdownType.suggestedFunctions)).map(([suggestion, subtext], idx) => {
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
                                onClick={() => {props.takeSuggestion(idx)}}
                                className={suggestionClassNames} 
                                key={suggestion}
                            >
                                <span className='text-overflow-hide' title={suggestion}>
                                    {suggestion}
                                </span>
                                {selected &&
                                    <p className={classNames('cell-editor-suggestion-subtext', 'text-subtext-1')}>
                                        {subtext}
                                    </p>
                                }
                            </div>
                        )
                    })}
                </>
            }
            {/* Otherwise, display the documentation function */}
            {displayedDropdownType?.type === 'documentation' &&
                <div>
                    <div className='cell-editor-function-documentation-header pt-5px pb-10px pl-10px pr-10px'>
                        <p className='text-body-2'>
                            {displayedDropdownType.documentationFunction.syntax}
                        </p>
                        <p className='cell-editor-function-documentation-body text-subtext-1'>
                            {displayedDropdownType.documentationFunction.description}
                        </p>
                    </div>
                    {displayedDropdownType.documentationFunction.examples && 
                        <div className='pt-5px pb-10px pr-10px pl-10px'>
                            <p className='text-subtext-1'>
                                Examples
                            </p>
                            {displayedDropdownType.documentationFunction.examples?.map((example, index) => {
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
                    }
                </div>
            }
            {/* Always display a link to the documentation */}
            <a
                className={classNames('text-body-2', 'text-body-2-link', 'cell-editor-dropdown-link')}
                target='_blank'
                rel='noreferrer'
                href={FORMULA_DOC_LINK}
            >
                {'See all formulas'}
            </a>
        </div>
    )
}

export default CellEditorDropdown;