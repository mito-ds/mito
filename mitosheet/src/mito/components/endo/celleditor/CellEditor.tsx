/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import '../../../../../css/endo/CellEditor.css';
import { MitoAPI,  MitoAPIResult } from '../../../api/api';
import { useEffectOnResizeElement } from '../../../hooks/useEffectOnElementResize';
import { AnalysisData, EditorState, FormulaLocation, GridState, SheetData, SheetView, UIState } from '../../../types';
import { getColumnHeaderParts, getDisplayColumnHeader } from '../../../utils/columnHeaders';
import { TaskpaneType } from '../../taskpanes/taskpanes';
import { KEYS_TO_IGNORE_IF_PRESSED_ALONE } from '../EndoGrid';
import { submitRenameColumnHeader } from '../columnHeaderUtils';
import { focusGrid } from '../focusUtils';
import { getNewSelectionAfterKeyPress, isNavigationKeyPressed } from '../selectionUtils';
import { firstNonNullOrUndefined, getCellDataFromCellIndexes } from '../utils';
import { ensureCellVisible } from '../visibilityUtils';
import CellEditorDropdown, { MAX_SUGGESTIONS, getDisplayedDropdownType } from './CellEditorDropdown';
import { getFullFormula, getSelectionFormulaString, getStartingFormula } from './cellEditorUtils';

// NOTE: we just set the width to 250 pixels
export const CELL_EDITOR_DEFAULT_WIDTH = 250;
export const CELL_EDITOR_MAX_WIDTH = 500;
export const CELL_EDITOR_MAX_HEIGHT = 150;

const getDefaultTextAreaHeight = (formula: string): number => {
    const numNewLines = formula.split('\n').length;

    if (numNewLines <= 2) {
        return 18;
    }

    return 9 * numNewLines;
}

/* 
    A CellEditor allows the user to edit the formula or value of a cell.
    
    The main complexity is allowing the user to select column headers by 
    clicking or using the arrow keys. It is handled inside this component, 
    by overwriting the cell navigation logic and updating the selection here. 
    Clicking on columns is handled inside the EndoGrid itself.

    The CellEditor takes up the entire parent component. 
*/
const CellEditor = (props: {
    sheetDataArray: SheetData[],
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
    analysisData: AnalysisData
    mitoContainerRef: React.RefObject<HTMLDivElement>,
}): JSX.Element => {

    const fullFormula = getFullFormula(props.editorState, props.sheetDataArray, props.sheetIndex);
    const sheetData = props.sheetDataArray[props.editorState.sheetIndex];

    const cellEditorInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

    const [selectedSuggestionIndex, setSavedSelectedSuggestionIndex] = useState(-1);
    const [loading, setLoading] = useState(false);
    const [cellEditorError, setCellEditorError] = useState<string | undefined>(undefined);
    const [selectionRangeToSet, setSelectionRangeToSet] = useState<number|undefined>(undefined) // Allows us to place the cursor at a specific location
    const [textAreaHeight, setTextAreaHeight] = useState(() => getDefaultTextAreaHeight(fullFormula));

    const {columnID, columnHeader, indexLabel} = getCellDataFromCellIndexes(sheetData, props.editorState.rowIndex, props.editorState.columnIndex);

    // When we first render the cell editor input, make sure to save it and focus on it
    // and ensure our cursor is at the final input
    const setRef = useCallback((unsavedInputAnchor: HTMLInputElement | HTMLTextAreaElement | null) => {
        if (unsavedInputAnchor !== null) {
            // Save this node, so that we can update 
            cellEditorInputRef.current = unsavedInputAnchor;

            // Focus on the input after a tiny delay. I'm not sure why we need this delay, 
            // it is only requred when the cell editor is in the grid, not in the formula bar.
            setTimeout(() => {
                const current = cellEditorInputRef.current;
                current?.focus()
                current?.setSelectionRange(current?.value.length,current?.value.length);
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

            // If there is a pendingSelections, then we set the selection to be 
            // at the _end_ of them!
            if (props.editorState.pendingSelections !== undefined) {
                const index = props.editorState.pendingSelections.inputSelectionStart + getSelectionFormulaString(props.editorState.pendingSelections.selections, props.sheetDataArray[props.sheetIndex], props.editorState.sheetIndex).length;
                cellEditorInputRef.current?.setSelectionRange(
                    index, index
                )
            }
            
        })
    }, [props.editorState.pendingSelections]);

    // Place the selection range to the correct spot
    useEffect(() => {
        if (selectionRangeToSet !== undefined) {
            cellEditorInputRef.current?.setSelectionRange(
                selectionRangeToSet, selectionRangeToSet
            )
            setSelectionRangeToSet(undefined);
        }
    }, [props.editorState.formula])

    useEffect(() => {
        props.setEditorState(prevEditingState => {
            if (prevEditingState === undefined) {
                return prevEditingState;
            } 
            
            const startingColumnFormula = getStartingFormula(sheetData, prevEditingState, props.editorState.rowIndex, props.editorState.columnIndex, props.analysisData.defaultApplyFormulaToColumn).startingColumnFormula
            return {
                ...prevEditingState,
                formula: startingColumnFormula
            }
        })
    }, [props.editorState.editingMode])

    useEffectOnResizeElement(() => {
        const newHeightString = cellEditorInputRef.current?.style.height;
        const newHeight = parseInt(newHeightString?.substring(0, newHeightString.length - 2) || '18');
        setTextAreaHeight(newHeight)
    }, [], props.mitoContainerRef, '#cell-editor-input')

    if (columnID === undefined || columnHeader === undefined) {
        return <></>;
    }

    const displayedDropdownType = getDisplayedDropdownType(
        props.sheetDataArray,
        props.editorState.sheetIndex,
        props.editorState,
        cellEditorInputRef.current?.selectionStart,
        cellEditorError,
        loading,
        props.analysisData,
    )

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
        // If there are no suggestions, or none is selected, then bounce
        if (displayedDropdownType?.type !== 'suggestions' || suggestionIndex < 0) {
            return;
        }

        // If the user presses tab, and they are currently have a suggestion selected, then
        // we go ahead and take that suggestion
        let suggestionReplacementLength = 0;
        let suggestion = '';

        let isColumnHeaderSuggestion = true;
        if (suggestionIndex < displayedDropdownType.suggestedColumnHeaders.length) {
            suggestionReplacementLength = displayedDropdownType.suggestedColumnHeadersReplacementLength
            suggestion = displayedDropdownType.suggestedColumnHeaders[suggestionIndex][0];
        } else {
            suggestionReplacementLength = displayedDropdownType.suggestedFunctionsReplacementLength
            // We add a open parentheses onto the formula suggestion
            suggestion = displayedDropdownType.suggestedFunctions[suggestionIndex - displayedDropdownType.suggestedColumnHeaders.length][0] + '(';
            isColumnHeaderSuggestion = false;
        }

        // Strip the prefix, and append the suggestion, and the current index label as well
        let newFormula = fullFormula.substr(0, fullFormula.length - suggestionReplacementLength);
        newFormula += suggestion;
        if (isColumnHeaderSuggestion && indexLabel !== undefined) {
            newFormula += getDisplayColumnHeader(indexLabel);
        }

        // Update the cell editor state
        props.setEditorState({
            ...props.editorState,
            formula: newFormula,
            pendingSelections: undefined,
            arrowKeysScrollInFormula: props.editorState.editorLocation === 'formula bar' ? true : false,
        })

        // Make sure we jump to the end of the input, as we took the suggestion
        cellEditorInputRef.current?.setSelectionRange(
            newFormula.length, newFormula.length
        )
    }

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

            if ((arrowUp || arrowDown) && displayedDropdownType?.type === 'suggestions') {
                // (A) - They are navigating inside the suggestion box

                // Prevent the default, so we don't move in the input
                e.preventDefault();

                // Adjust the saved selected index, while attempting to keep it in bounds
                if (arrowUp) {
                    setSavedSelectedSuggestionIndex(suggestionIndex => Math.max(suggestionIndex - 1, -1))
                } else if (arrowDown) {
                    setSavedSelectedSuggestionIndex(suggestionIndex => Math.min(suggestionIndex + 1, displayedDropdownType.suggestedColumnHeaders.length + displayedDropdownType.suggestedFunctions.length - 1, MAX_SUGGESTIONS))
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
                    const newSelection = getNewSelectionAfterKeyPress(gridState.selections[gridState.selections.length - 1], e, sheetData);

                    // If there is already some suggested column headers, we do not change this selection, 
                    // as we want any future expanded selection of column headers to overwrite the same 
                    // region. So default to pendingSelections?.selectionStart, but if this does not
                    // exist, than take the selection range in the input currently
                    const newInputSelectionStart = firstNonNullOrUndefined(
                        props.editorState.pendingSelections?.inputSelectionStart,
                        cellEditorInputRef.current?.selectionStart,
                        0
                    )
                    const newInputSelectionEnd = firstNonNullOrUndefined(
                        props.editorState.pendingSelections?.inputSelectionEnd,
                        cellEditorInputRef.current?.selectionEnd,
                        0
                    )

                    props.setEditorState({
                        ...props.editorState,
                        pendingSelections: {
                            selections: [newSelection],
                            inputSelectionStart: newInputSelectionStart,
                            inputSelectionEnd: newInputSelectionEnd
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
            } else {
                // Otherwise, we are just pressing arrow keys to scroll in the input itself. In this case,
                // because we might want the cell editor to refresh the documentation function, we simply 
                // refresh the cell editor, which will update the documentation function
                props.setEditorState((prevEditorState) => {
                    if (prevEditorState === undefined) return undefined;
                    return {
                        ...prevEditorState,
                    }
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
                        sheetIndex: props.sheetIndex,
                    }]
                }
            });

            ensureCellVisible(
                props.containerRef.current, props.scrollAndRenderedContainerRef.current,
                props.currentSheetView, props.gridState,
                props.editorState.rowIndex, props.editorState.columnIndex
            );

            // Take the pendingSelections, and clear them
            const fullFormula = getFullFormula(props.editorState, props.sheetDataArray, props.sheetIndex);

            props.setEditorState({
                ...props.editorState,
                formula: fullFormula,
                pendingSelections: undefined,
            })
        }
    }

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {

        const CHARS_TO_REMOVE_SCROLL_IN_FORMULA = [
            ' ',
            ',',
            '(', ')',
            '-', '+', '*', '/',
            '=',
            ':'
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
        })
    }

    const onClick = () => {
        // As in Excel or Google Sheets, if you click the input, then
        // the arrow keys now navigate within the formula, rather than
        // selecting columns in the sheet
        props.setEditorState({
            ...props.editorState,
            arrowKeysScrollInFormula: true
        })
    }

    const addSpacingCharacter = (char: '\n' | '\t'): void => {
        let selectionStart = cellEditorInputRef.current?.selectionStart;
        selectionStart = selectionStart === null || selectionStart === undefined ? 0 : selectionStart;
        const newFormula = fullFormula.substring(0, selectionStart) + char + fullFormula.substring(selectionStart);

        props.setEditorState(prevEditingState => {
            if (prevEditingState === undefined) {
                return undefined
            }
            return {
                ...prevEditingState,
                formula: newFormula
            }
        })

        // And make sure we put the selection at the right place, which is right after the new line
        setSelectionRangeToSet(selectionStart + 1)

        // Add more space if we add a line
        if (char === '\n') {
            setTextAreaHeight(prevHeight => prevHeight += 11)
        }
    }


    const onSubmit = async (e: React.FormEvent<HTMLFormElement | HTMLTextAreaElement>) => {

        // Don't refresh the page
        e.preventDefault();

        // If the user is currently editing a cell but is looking at a different sheet (for cross-sheet formulas),
        // then we want to switch to the sheet they are editing in when they're done editing the cell. 
        if (props.sheetIndex !== props.editorState.sheetIndex) {
            props.setUIState((prevUIState: UIState) => {
                return {
                    ...prevUIState,
                    selectedSheetIndex: props.editorState.sheetIndex
                }
            })
        }

        // If we have a suggested item selected, then this should be handled by the onKeyDown
        // above, as we want to take the suggestion, so we actually don't submit here
        if (selectedSuggestionIndex !== -1) {
            takeSuggestion(selectedSuggestionIndex);
            setSavedSelectedSuggestionIndex(-1);
            return;
        }

        const editorSheetData = props.sheetDataArray[props.editorState.sheetIndex];
        const columnID = editorSheetData.data[props.editorState.columnIndex].columnID;
        const columnHeader = editorSheetData.data[props.editorState.columnIndex].columnHeader;
        const formula = getFullFormula(props.editorState, props.sheetDataArray, props.sheetIndex);
        const formulaLabel = editorSheetData.index[props.editorState.rowIndex];

        // Mark this as loading
        setLoading(true);
        
        let errorMessage: MitoAPIResult<never> | undefined = undefined;

        // Make sure to send the write type of message, depending on the editor
        if (props.editorState.rowIndex == -1) {
            // Change of column header
            const finalColumnHeader = getColumnHeaderParts(columnHeader).finalColumnHeader;
            submitRenameColumnHeader(columnHeader, finalColumnHeader, columnID, props.sheetIndex, props.editorState, props.setUIState, props.mitoAPI)
        } else {
            // Otherwise, update the formula for the column (or specific index)
            const index_labels_formula_is_applied_to: FormulaLocation = props.editorState.editingMode === 'specific_index_labels' && indexLabel != undefined 
                ? {'type': 'specific_index_labels', 'index_labels': [indexLabel]}
                : {'type': 'entire_column'}


            errorMessage = await props.mitoAPI.editSetColumnFormula(
                props.editorState.sheetIndex,
                columnID,
                formulaLabel,
                formula,
                index_labels_formula_is_applied_to,
                props.editorState.editorLocation
            )
        }
        
        setLoading(false);

        // Don't let the user close the editor if this is an invalid formula
        // TODO: do we want a loading message?
        if (errorMessage !== undefined && 'error' in errorMessage) {
            setCellEditorError(errorMessage.error);
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
                
                {/** If we're in the formula bar, then we show a text area */}
                {props.editorState.editorLocation === 'cell' && 
                    <input
                        ref={setRef}
                        id='cell-editor-input'
                        className='cell-editor-input'
                        onClick={onClick}
                        value={fullFormula.replace(/\t/g, '')} // Don't show tabs (TODO: bug if strings have tabs?)
                        onKeyDown={onKeyDown}
                        onChange={onChange}
                        autoComplete='off'
                    />
                }
                {props.editorState.editorLocation === 'formula bar' && 
                    <textarea
                        ref={setRef}
                        id='cell-editor-input'
                        className='cell-editor-input'
                        style={{'resize': 'none', 'maxHeight': `${textAreaHeight}px`, 'height': `${textAreaHeight}px`, 'marginTop': 0}}
                        onClick={onClick}
                        value={fullFormula}
                        autoComplete='off'
                        spellCheck='false'
                        onKeyUp={(e) => {
                            // Since we can't detect Shift + Enter in onKeyDown, we need to do it here
                            if (e.key == 'Enter' && e.shiftKey) {
                                addSpacingCharacter('\n');
                                return;
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                if (!e.metaKey) {
                                    // If we press enter and the meta key is not pressed, we want to submit (or take suggestion)
                                    e.preventDefault();
                                    void onSubmit(e);
                                    return;
                                } else {
                                    addSpacingCharacter('\n');
                                    return;
                                }
                            }

                            // If the tab key is pressed, we want to take the suggestion if there is one
                            if (e.key === 'Tab') {
                                e.preventDefault();
                                if (selectedSuggestionIndex !== -1) {
                                    takeSuggestion(selectedSuggestionIndex);
                                    setSavedSelectedSuggestionIndex(-1);
                                } else {
                                    addSpacingCharacter('\t');
                                    return
                                }
                            }

                            // If up and down arrow key is pressed, and there are suggestions, we skip the default behavior
                            // and do not move the cursor. This is because we want to use the arrow keys to navigate
                            // the suggestions, rather than moving the cursor
                            if (displayedDropdownType?.type === 'suggestions' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                                e.preventDefault();
                            }

                            onKeyDown(e);
                        }}
                        onChange={onChange}
                    />
                }
            </form>
            <CellEditorDropdown
                sheetDataArray={props.sheetDataArray}
                sheetIndex={props.sheetIndex}
                editorState={props.editorState}
                setEditorState={props.setEditorState}
                cellEditorInputRef={cellEditorInputRef}
                selectedSuggestionIndex={selectedSuggestionIndex}
                setSavedSelectedSuggestionIndex={setSavedSelectedSuggestionIndex}
                takeSuggestion={takeSuggestion}
                displayedDropdownType={displayedDropdownType}
            />
        </div>
    )
}

export default CellEditor;