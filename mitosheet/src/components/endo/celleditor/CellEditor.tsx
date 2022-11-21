import React, { useCallback, useEffect, useRef, useState } from 'react';
import '../../../../css/endo/CellEditor.css';
import MitoAPI from '../../../jupyter/api';
import { formulaEndsInColumnHeader, getFullFormula, getSuggestedColumnHeaders, getDocumentationFunction, getSuggestedFunctions, getStartingFormula } from './cellEditorUtils';
import { KEYS_TO_IGNORE_IF_PRESSED_ALONE } from '../EndoGrid';
import { focusGrid } from '../focusUtils';
import { getColumnHeadersInSelection, getNewSelectionAfterKeyPress, isNavigationKeyPressed } from '../selectionUtils';
import { EditorState, GridState, MitoError, SheetData, SheetView, UIState } from '../../../types';
import { firstNonNullOrUndefined, getCellDataFromCellIndexes } from '../utils';
import { classNames } from '../../../utils/classNames';
import { ensureCellVisible } from '../visibilityUtils';
import LoadingDots from '../../elements/LoadingDots';
import { getColumnHeaderParts, getDisplayColumnHeader} from '../../../utils/columnHeaders';
import { submitRenameColumnHeader } from '../columnHeaderUtils';
import { isMitoError } from '../../../utils/errors';
import { TaskpaneType } from '../../taskpanes/taskpanes';
import Toggle from '../../elements/Toggle';
import Row from '../../layout/Row';

const MAX_SUGGESTIONS = 4;
// NOTE: we just set the width to 250 pixels
export const CELL_EDITOR_WIDTH = 250;

/* 
    A CellEditor allows the user to edit the formula or value of a cell.
    
    The main complexity is allowing the user to select column headers by 
    clicking or using the arrow keys. It is handled inside this component, 
    by overwriting the cell navigation logic and updating the selection here. 
    Clicking on columns is handled inside the EndoGrid itself.

    The CellEditor takes up the entire parent component. 
*/
const CellEditor = (props: {
    sheetData: SheetData,
    sheetIndex: number,
    gridState: GridState,
    editorState: EditorState,
    setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>,
    setGridState: React.Dispatch<React.SetStateAction<GridState>>,
    setUIState: React.Dispatch<React.SetStateAction<UIState>>,
    scrollAndRenderedContainerRef: React.RefObject<HTMLDivElement>,
    containerRef: React.RefObject<HTMLDivElement>,
    mitoAPI: MitoAPI,
    currentSheetView: SheetView
    closeOpenEditingPopups: (taskpanesToKeepIfOpen?: TaskpaneType[]) => void;
}): JSX.Element => {

    const cellEditorInputRef = useRef<HTMLInputElement | null>(null);

    const [selectedSuggestionIndex, setSavedSelectedSuggestionIndex] = useState(-1);
    const [loading, setLoading] = useState(false);
    const [cellEditorError, setCellEditorError] = useState<string | undefined>(undefined);

    const {columnID, columnHeader} = getCellDataFromCellIndexes(props.sheetData, props.editorState.rowIndex, props.editorState.columnIndex);

    // When we first render the cell editor input, make sure to save it and focus on it
    const setRef = useCallback((unsavedInputAnchor: HTMLInputElement) => {
        if (unsavedInputAnchor !== null) {
            // Save this node, so that we can update 
            cellEditorInputRef.current = unsavedInputAnchor;

            // Focus on the input after a tiny delay. I'm not sure why we need this delay, 
            // it is only requred when the cell editor is in the grid, not in the formula bar.
            setTimeout(() => {
                cellEditorInputRef.current?.focus()
            }, 50);
        }
    },[]);

    /* 
        This effect makes sure that when the pending selected columns change,
        the cell stays focused (as the user might have clicked on different cell),
        and that the selection range inside the cell editor is at the end of 
        the columns they have pending...

        We wrap in a setTimeout with no delay, which makes sure the range is set
        properly after the value in the input updates. 

        See here: https://stackoverflow.com/questions/9596419/what-are-some-reasons-for-jquery-focus-not-working/26754609
    */
    useEffect(() => {
        setTimeout(() => {
            // Focus the input
            cellEditorInputRef.current?.focus();

            // If there is a pendingSelectedColumns, then we set the selection to be 
            // at the _end_ of them!
            if (props.editorState.pendingSelectedColumns !== undefined) {
                const index = props.editorState.pendingSelectedColumns.selectionStart + props.editorState.pendingSelectedColumns.columnHeaders.map(ch => getDisplayColumnHeader(ch)).join(', ').length;
                cellEditorInputRef.current?.setSelectionRange(
                    index, index
                )
            }
            
        })
    }, [props.editorState.pendingSelectedColumns]);

    useEffect(() => {
        props.setEditorState(prevEditingState => {
            if (prevEditingState === undefined) {
                return prevEditingState;
            } 
            
            const startingColumnFormula = getStartingFormula(props.sheetData, prevEditingState, props.editorState.rowIndex, props.editorState.columnIndex, props.editorState.editingMode).startingColumnFormula
            return {
                ...prevEditingState,
                formula: startingColumnFormula
            }
        })
    }, [props.editorState.editingMode])

    if (columnID === undefined || columnHeader === undefined) {
        return <></>;
    }

    const fullFormula = getFullFormula(props.editorState.formula, columnHeader, props.editorState.pendingSelectedColumns);
    const endsInColumnHeader = formulaEndsInColumnHeader(fullFormula, props.sheetData);

    const documentationFunction = getDocumentationFunction(fullFormula);

    // NOTE: we get our suggestions off the non-full formula, as we don't want to make suggestions
    // for column headers that are pending currently
    const [suggestedColumnHeadersReplacementLength, suggestedColumnHeaders] = getSuggestedColumnHeaders(props.editorState.formula, columnID, props.sheetData);
    const [suggestedFunctionsReplacementLength, suggestedFunctions] = getSuggestedFunctions(props.editorState.formula, suggestedColumnHeadersReplacementLength);
    const hasSuggestions = suggestedColumnHeaders.length > 0 || suggestedFunctions.length > 0;


    // A helper function to close the cell editor, selecting the cell that was
    // being edited, and making sure the cell is focused
    const closeCellEditor = () => {
        props.setGridState((gridState) => {
            return {
                ...gridState,
                selection: [{
                    startingRowIndex: props.editorState.rowIndex,
                    endingRowIndex: props.editorState.rowIndex,
                    startingColumnIndex: props.editorState.columnIndex,
                    endingColumnIndex: props.editorState.columnIndex,
                }]
            }
        })
        props.setEditorState(undefined);
        
        ensureCellVisible(
            props.containerRef.current, props.scrollAndRenderedContainerRef.current,
            props.currentSheetView, props.gridState,
            props.editorState.rowIndex, props.editorState.columnIndex
        );
        
        // We then focus on the grid, as we are no longer focused on the cell editor
        setTimeout(() => focusGrid(props.containerRef.current), 100);
    }

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
        if (suggestionIndex < suggestedColumnHeaders.length) {
            suggestionReplacementLength = suggestedColumnHeadersReplacementLength
            suggestion = suggestedColumnHeaders[suggestionIndex][0];
        } else {
            suggestionReplacementLength = suggestedFunctionsReplacementLength
            // We add a open parentheses onto the formula suggestion
            suggestion = suggestedFunctions[suggestionIndex - suggestedColumnHeaders.length][0] + '(';
        }

        // Get the full formula
        let fullFormula = getFullFormula(
            props.editorState.formula, 
            columnHeader,
            props.editorState.pendingSelectedColumns
        );

        // Strip the prefix, and append the suggestion
        fullFormula = fullFormula.substr(0, fullFormula.length - suggestionReplacementLength);
        fullFormula += suggestion;

        // Update the cell editor state
        props.setEditorState({
            ...props.editorState,
            formula: fullFormula,
            pendingSelectedColumns: undefined,
            arrowKeysScrollInFormula: props.editorState.editorLocation === 'formula bar' ? true : false
        })

        // Make sure we jump to the end of the input, as we took the suggestion
        cellEditorInputRef.current?.setSelectionRange(
            fullFormula.length, fullFormula.length
        )
    }

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Don't let the key down go anywhere else
        e.stopPropagation();

        // Keep the event around, so that we can use it in later callbacks
        // and pass it through to callbacks
        e.persist()

        // Clear the cell editor error
        setCellEditorError(undefined);

        if (KEYS_TO_IGNORE_IF_PRESSED_ALONE.includes(e.key)) {
            return;
        }

        const altPressed = e.altKey;
        const arrowKeysScrollInFormula = props.editorState.arrowKeysScrollInFormula === true;

        /* 
            If the user presses a key in the input, there are a few cases that we need to handle. 

            1.  The user presses a navigation key. In this case, we check if they are:
                (A) navigating within the suggestion box 
                (B) accepting a suggestion from the suggestion box
                (C) navigating in the sheet itself
                (D) the default case (we do no work), where they are moving inside the editor
            2.  If it's the escape key, we close the cell editor.
            3.  The user presses any other key. In this case, we just let the input change as 
                normal, but also _take any column headers_ the user may have been selecting
                and finalize inserting them into the formula. Thus if the user starts typing
                after selecting some column headers, we take insert these headers into the formula.
        */
        if (isNavigationKeyPressed(e.key) && !altPressed) {
            // If the user presses an up or down arrow, and there are suggested headers or functions,
            // then we scroll up and down
            const arrowUp = e.key === 'Up' || e.key === 'ArrowUp';
            const arrowDown = e.key === 'Down' || e.key === 'ArrowDown';

            if (!endsInColumnHeader && props.editorState.editingMode === 'set_column_formula' && (arrowUp || arrowDown) && (suggestedColumnHeaders.length > 0 || suggestedFunctions.length > 0)) {
                // (A) - They are navigating inside the suggestion box

                // Prevent the default, so we don't move in the input
                e.preventDefault();

                // Adjust the saved selected index, while attempting to keep it in bounds
                if (arrowUp) {
                    setSavedSelectedSuggestionIndex(suggestionIndex => Math.max(suggestionIndex - 1, -1))
                } else if (arrowDown) {
                    setSavedSelectedSuggestionIndex(suggestionIndex => Math.min(suggestionIndex + 1, suggestedColumnHeaders.length + suggestedFunctions.length - 1, MAX_SUGGESTIONS))
                }

                // As google sheets does, if the user is scrolling in the suggestion box,
                // then we make their arrow keys scroll in the formula
                props.setEditorState((prevEditorState) => {
                    if (prevEditorState === undefined) return undefined;
                    return {
                        ...prevEditorState,
                        arrowKeysScrollInFormula: true
                    }
                })

            } else if (e.key === 'Tab') {
                // (B) accepting a suggestion from the selection box. Note that this is also done
                // in the onSubmit of the input form, as onKeyDown for an input does not detect
                // the enter, for some reason...

                // Prevent the default, so we don't move inputs
                e.preventDefault();

                // Take the suggestion
                takeSuggestion(selectedSuggestionIndex);

            } else if (!arrowKeysScrollInFormula) {
                // (C) navigating inside the sheet

                // Prevent the default, so arrow keys don't scroll in formula
                e.preventDefault();

                // Otherwise, we navigate within the grid itself, adding pending columns, if the 
                // arrow keys are not scrolling in the formula

                props.setGridState((gridState) => {
                    const newSelection = getNewSelectionAfterKeyPress(gridState.selections[gridState.selections.length - 1], e, props.sheetData);
                    const columnHeaders = getColumnHeadersInSelection(newSelection, props.sheetData);

                    // If there is already some suggested column headers, we do not change this selection, 
                    // as we want any future expanded selection of column headers to overwrite the same 
                    // region. So default to pendingSelectedColumns?.selectionStart, but if this does not
                    // exist, than take the selection range in the input currently
                    const newSelectionStart = firstNonNullOrUndefined(
                        props.editorState.pendingSelectedColumns?.selectionStart,
                        cellEditorInputRef.current?.selectionStart,
                        0
                    )
                    const newSelectionEnd = firstNonNullOrUndefined(
                        props.editorState.pendingSelectedColumns?.selectionEnd,
                        cellEditorInputRef.current?.selectionEnd,
                        0
                    )

                    props.setEditorState({
                        ...props.editorState,
                        pendingSelectedColumns: {
                            columnHeaders: columnHeaders,
                            selectionStart: newSelectionStart,
                            selectionEnd: newSelectionEnd
                        },
                    })

                    ensureCellVisible(
                        props.containerRef.current, props.scrollAndRenderedContainerRef.current,
                        props.currentSheetView, props.gridState,
                        newSelection.endingRowIndex, newSelection.endingColumnIndex
                    );

                    return {
                        ...gridState,
                        selections: [newSelection]
                    };
                })
            }
        } else if (e.key === 'Escape') {
            // Stop the default, in case we're leaving full screen mode
            e.preventDefault();
            // 2) Close if escape is pressed
            closeCellEditor()
        } else if (e.key !== 'Enter') {
            // 3) Case where they press any non-navigation key, except Enter. 
            // We don't handle Enter because its handled by the onSubmit listener, 
            // and it can either be used to take a selectedSuggestion or submit the formula.
            
            // First, reset the suggestion index that is selected back to -1, 
            // so that noting is selected
            setSavedSelectedSuggestionIndex(-1)

            // Otherwise, snap selection and view back to the edited cell
            props.setGridState((gridState) => {
                return {
                    ...gridState,
                    selections: [{
                        startingRowIndex: props.editorState.rowIndex,
                        endingRowIndex: props.editorState.rowIndex,
                        startingColumnIndex: props.editorState.columnIndex,
                        endingColumnIndex: props.editorState.columnIndex,
                    }]
                }
            });

            ensureCellVisible(
                props.containerRef.current, props.scrollAndRenderedContainerRef.current,
                props.currentSheetView, props.gridState,
                props.editorState.rowIndex, props.editorState.columnIndex
            );

            // Take the pendingSelectedColumns, and clear them
            const fullFormula = getFullFormula(
                props.editorState.formula, 
                columnHeader,
                props.editorState.pendingSelectedColumns
            );
                
            props.setEditorState({
                ...props.editorState,
                formula: fullFormula,
                pendingSelectedColumns: undefined
            })
        }
    }


    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {

        // Don't refresh the page
        e.preventDefault();

        // If we have a suggested item selected, then this should be handled by the onKeyDown
        // above, as we want to take the suggestion, so we actually don't submit here
        if (selectedSuggestionIndex !== -1) {
            takeSuggestion(selectedSuggestionIndex);

            // Then, reset the suggestion index that is selected back to -1, 
            // so that nothing is selected
            setSavedSelectedSuggestionIndex(-1);

            return;
        }

        const columnID = props.sheetData.data[props.editorState.columnIndex].columnID;
        const columnHeader = props.sheetData.data[props.editorState.columnIndex].columnHeader;
        const formula = getFullFormula(props.editorState.formula, columnHeader, props.editorState.pendingSelectedColumns)

        // Mark this as loading
        setLoading(true);
        
        let errorMessage: MitoError | undefined = undefined;

        // Make sure to send the write type of message, depending on the editor
        if (props.editorState.rowIndex == -1) {
            // Change of column header
            const finalColumnHeader = getColumnHeaderParts(columnHeader).finalColumnHeader;
            submitRenameColumnHeader(columnHeader, finalColumnHeader, columnID, props.sheetIndex, props.editorState, props.setUIState, props.mitoAPI)
        } else {
            if (props.editorState.editingMode === 'set_column_formula') {
                // Change of formula
                errorMessage = await props.mitoAPI.editSetColumnFormula(
                    props.sheetIndex,
                    columnID,
                    formula,
                    props.editorState.editorLocation
                )
            } else {
                // Change of data
                // Get the index of the edited row in the dataframe. This isn't the same as the editorState.rowIndex
                // because the editorState.rowIndex is simply the row number in the Mito Spreadsheet which is affected by sorts, etc.
                const rowIndex = props.sheetData.index[props.editorState.rowIndex];
                errorMessage = await props.mitoAPI.editSetCellValue(
                    props.sheetIndex,
                    columnID,
                    rowIndex,
                    formula,
                    props.editorState.editorLocation
                )
            } 
        }
        
        setLoading(false);

        // Don't let the user close the editor if this is an invalid formula
        // TODO: do we want a loading message?
        if (isMitoError(errorMessage)) {
            setCellEditorError(errorMessage.to_fix);
        } else {
            closeCellEditor();
            props.closeOpenEditingPopups();
        }
    }

    return (
        <div className='cell-editor'>
            <form
                className='cell-editor-form'
                onSubmit={onSubmit}
                autoComplete='off' // Turn off autocomplete so the html suggestion box doesn't cover Mito's suggestion box.
            >
                <input
                    ref={setRef}
                    id='cell-editor-input'
                    className='cell-editor-input'
                    onClick={() => {
                        // As in Excel or Google Sheets, if you click the input, then
                        // the arrow keys now navigate within the formula, rather than
                        // selecting columns in the sheet
                        props.setEditorState({
                            ...props.editorState,
                            arrowKeysScrollInFormula: true
                        })
                    }}
                    value={getFullFormula(props.editorState.formula, columnHeader, props.editorState.pendingSelectedColumns)}
                    onKeyDown={onKeyDown}
                    onChange={(e) => {

                        const CHARS_TO_REMOVE_SCROLL_IN_FORMULA = [
                            ' ',
                            ',',
                            '(', ')',
                            '-', '+', '*', '/',
                            '='
                        ]

                        let arrowKeysScrollInFormula = true
                        if (props.editorState.editorLocation === 'cell') {
                            // If we are typing at the end of the formula, and we type a CHARS_TO_REMOVE_SCROLL_IN_FORMULA,
                            // then we reset the arrowKeysScrollInFormula to false. Furtherrmore, if the formula is empty, 
                            // we reset the arrow keys to scroll in the sheet. Otherwise, we keep it as is.
                            // This attempts to match what Excel and Google Sheets do
                            const atEndOfFormula = (e.target.selectionStart || 0) >= e.target.value.length;
                            const finalChar = e.target.value.substring(e.target.value.length - 1);
                            const endsInResetCharacter = atEndOfFormula && CHARS_TO_REMOVE_SCROLL_IN_FORMULA.includes(finalChar)
                            const isEmpty = e.target.value.length === 0;
                            arrowKeysScrollInFormula = props.editorState.arrowKeysScrollInFormula !== undefined && !endsInResetCharacter && !isEmpty; 
                        }
                        
                        props.setEditorState({
                            ...props.editorState,
                            formula: e.target.value,
                            arrowKeysScrollInFormula: arrowKeysScrollInFormula
                        })}
                    }
                />
            </form>
            {/* 
                In the dropdown box, we either show an error, a loading message, suggestions
                or the documentation for the last function, depending on the cases below
            */}
            <div className='cell-editor-dropdown-box' style={{width: props.editorState.editorLocation === 'cell' ? `${CELL_EDITOR_WIDTH}px` : '300px'}}>
                {cellEditorError === undefined && props.editorState.rowIndex != -1 &&
                    <Row justify='space-between' align='center' className='cell-editor-label'>
                        <p className={classNames('text-subtext-1', 'pl-5px', 'mt-2px')} title={props.editorState.editingMode === 'set_column_formula' ? 'You are currently editing the entire column. Setting a formula will change all values in the column.' : 'You are currently editing a specific cell. Changing this value will only effect this cell.'}>
                            Edit entire column
                        </p>
                        <Toggle
                            className='mr-5px'
                            value={props.editorState.editingMode === 'set_column_formula' ? true : false}
                            onChange={() => {
                                props.setEditorState(prevEditorState => {
                                    if (prevEditorState === undefined) {
                                        return undefined
                                    }
                                    const prevEditingMode = {...prevEditorState}.editingMode
                                    return {
                                        ...prevEditorState,
                                        editingMode: prevEditingMode === 'set_column_formula' ? 'set_cell_value' : 'set_column_formula'
                                    }
                                })
                            }}
                            height='20px'
                        />
                    </Row>
                }
                {cellEditorError === undefined && props.editorState.rowIndex == -1 &&
                    <p className={classNames('text-subtext-1', 'pl-5px', 'mt-2px')} title='You are currently editing the column header.'>
                        Edit column header
                    </p>
                }
                {/* Show an error if there is currently an error */}
                {cellEditorError !== undefined &&
                    <div className='cell-editor-error-container pl-10px pr-5px pt-5px pb-5px'>
                        <p className='text-body-1 text-color-error'>
                            {cellEditorError}
                        </p>
                        <p className='text-subtext-1'>
                            Press Escape to close the cell editor.
                        </p>
                    </div>
                }
                {/* Show we're loading if we're currently loading */}
                {loading && 
                    <p className='text-body-2 pl-5px'>
                        Processing<LoadingDots />
                    </p>
                }
                {/* Show the suggestions */}
                {cellEditorError === undefined && !loading && !endsInColumnHeader && props.editorState.editingMode === 'set_column_formula' &&
                    <>
                        {(suggestedColumnHeaders.concat(suggestedFunctions)).map(([suggestion, subtext], idx) => {
                            // We only show at most 4 suggestions
                            if (idx > MAX_SUGGESTIONS) {
                                return <></>
                            }

                            const selected = idx === selectedSuggestionIndex;
                            const suggestionClassNames = classNames('cell-editor-suggestion', 'text-body-2', {
                                'cell-editor-suggestion-selected': selected
                            });
                            
                            return (
                                <div 
                                    onMouseEnter={() => setSavedSelectedSuggestionIndex(idx)}
                                    onClick={() => {
                                        // Take a suggestion if you click on it
                                        takeSuggestion(idx);
                                        // Make sure we're focused
                                        cellEditorInputRef.current?.focus();
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
                {cellEditorError === undefined && !loading && props.editorState.editingMode === 'set_column_formula' && !hasSuggestions && documentationFunction !== undefined &&
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
                            {documentationFunction.examples?.map(example => {
                                return (
                                    <p 
                                        key={example}
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
        </div>
    )
}

export default CellEditor;