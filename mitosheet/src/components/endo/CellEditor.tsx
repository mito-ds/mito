import fscreen from 'fscreen';
import React, { useEffect, useRef, useState } from 'react';
import '../../../css/endo/CellEditor.css';
import MitoAPI from '../../api';
import { DataframeID, EditorState, GridState, MitoError, SheetData } from '../../types';
import { classNames } from '../../utils/classNames';
import { getDisplayColumnHeader, isPrimitiveColumnHeader } from '../../utils/columnHeaders';
import LoadingDots from '../elements/LoadingDots';
import { formulaEndsInColumnHeader, getDocumentationFunction, getFullFormula, getSuggestedColumnHeaders, getSuggestedFunctions } from './cellEditorUtils';
import { KEYS_TO_IGNORE_IF_PRESSED_ALONE } from './EndoGrid';
import { focusGrid } from './focusUtils';
import { getColumnHeadersInSelection, getNewSelectionAfterKeyPress, isNavigationKeyPressed } from './selectionUtils';
import { calculateCurrentSheetView, getCellInColumn, getCellInRow } from './sheetViewUtils';
import { firstNonNullOrUndefined, getCellDataFromCellIndexes } from './utils';
import { ensureCellVisible } from './visibilityUtils';

// NOTE: we just set the width to 250 pixels
const CELL_EDITOR_WIDTH = 250;
const MAX_SUGGESTIONS = 4;

/* 
    The cell editor is a popup that appears on top of the sheet, and displays
    a user an input that allows them to edit a formula. 

    The two seperate complexities with the cell editor are making sure that
    the cell editor is visible in the right location, and allowing users to
    select column headers by clicking or using the arrow keys.

    To make sure the editor is in the right location, we just have an effect
    that runs when the props change, and effectively make sure the editor is
    in the correct location. 

    Allowing users to select column headers by using the arrow keys is handeled
    inside this component, by overwriting the cell navigation logic and updating 
    the selection here. Clicking on columns is handeled inside the EndoGrid 
    itself.

    NOTE: for now, we ignore single cell editing. In the future, we'll just
    check the column type (formula vs constant), and do different things in
    either cases! We leave this to integration ;-)
*/
const CellEditor = (props: {
    sheetData: SheetData,
    selectedDataframeID: DataframeID,
    gridState: GridState,
    editorState: EditorState,
    setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>,
    setGridState: React.Dispatch<React.SetStateAction<GridState>>,
    scrollAndRenderedContainerRef: React.RefObject<HTMLDivElement>,
    containerRef: React.RefObject<HTMLDivElement>,
    mitoAPI: MitoAPI,
}): JSX.Element => {

    const cellEditorInputRef = useRef<HTMLInputElement>(null);

    const [editorStyle, setEditorStyle] = useState<{top?: number, left?: number, bottom?: number, right?: number, display?: string}>({
        top: 0,
        left: 0,
        display: 'none'
    })
    const [selectedSuggestionIndex, setSavedSelectedSuggestionIndex] = useState(-1);
    const [loading, setLoading] = useState(false);
    const [cellEditorError, setCellEditorError] = useState<string | undefined>(undefined);

    const currentSheetView = calculateCurrentSheetView(props.gridState);

    const {columnID, columnHeader} = getCellDataFromCellIndexes(props.sheetData, props.editorState.rowIndex, props.editorState.columnIndex);

    // Ensures that the cell editor is in the right location, when initially placed.
    // We don't move it, as it doesn't really make things better, as GSheets does not
    // and it really don't effect the experience of using the cell editor at all!
    // If you want to make the editor refresh it's location, just make it subscribe to 
    // grid state changes
    useEffect(() => {        
        const updateCellEditorPosition = () => {
    
            const scrollAndRenderedContainerRect = props.scrollAndRenderedContainerRef.current?.getBoundingClientRect();
            if (scrollAndRenderedContainerRect === undefined) {
                return;
            }
    
            const cellInRow = getCellInRow(props.scrollAndRenderedContainerRef.current, props.editorState.rowIndex);
            const cellInRowRect = cellInRow?.getBoundingClientRect();
            const cellInColumn = getCellInColumn(props.scrollAndRenderedContainerRef.current, props.editorState.columnIndex);
            const cellInColumnRect = cellInColumn?.getBoundingClientRect();
            
            /* 
                Generally, the max is the stop it from going below 0, 
                and the min is to stop it from going farther
                than the height/width of the viewport. 

                The default{Top/Left} makes sure that the max and min work out
                correctly, in the case of out of bounds above and below.
            */

            let top: number | undefined = undefined;
            let left: number | undefined = undefined;
            let bottom: number | undefined = undefined;
            let right: number | undefined = undefined;

            // 45 is the height of a single column header, and then each lower level element is
            // 25 px tall, so we calculate the total height to use in the placement of the 
            // cell editor
            const columnHeadersHeight = columnHeader === undefined || isPrimitiveColumnHeader(columnHeader) ? 45 : (45 + ((columnHeader.length - 1) * 25))
            const defaultTop = cellInRowRect ? cellInRowRect.y : (props.editorState.rowIndex < currentSheetView.startingRowIndex ? 0 : scrollAndRenderedContainerRect.y * 100) // 100 is a random large number to make the mins and maxs work out
            top = Math.min(Math.max(0, defaultTop - scrollAndRenderedContainerRect.y) + columnHeadersHeight, scrollAndRenderedContainerRect.height);
            // If we're too close to the bottom, just snap ot the bottom
            if (top >= scrollAndRenderedContainerRect.height - 50) {
                top = undefined;
                bottom = 0;
            }

            const defaultLeft = cellInColumnRect ? cellInColumnRect.x : (props.editorState.columnIndex < currentSheetView.startingColumnIndex ? 0 : scrollAndRenderedContainerRect.x * 100) // 100 is a random large number to make the mins and maxs work out
            // 80 is the width of the index. If you change the css, then change here
            left = Math.min(Math.max(0, defaultLeft - scrollAndRenderedContainerRect.x) + 80, scrollAndRenderedContainerRect.width);
            // If we're too close to the right, just snap to the right
            if (left + CELL_EDITOR_WIDTH >= scrollAndRenderedContainerRect.width) {
                left = undefined;
                right = 0;
            }

            // Don't update if we don't need to, and note that is required to avoid entering
            // a loop that makes the cell editor not work
            if (top === editorStyle.top && left === editorStyle.left && bottom === editorStyle.bottom && right === editorStyle.right) {
                return;
            }
    
            setEditorStyle({
                top: top,
                left: left,
                bottom: bottom,
                right: right,
                display: undefined
            });
        }

        // Make it so the setting of the cell editor positon just runs after the
        // current execution context finishes, to make sure everything is placed
        // properly.
        setTimeout(updateCellEditorPosition)

        // We reposition the cell editor when you enter or leave fullscreen mode, to make
        // sure that it stays visible
        fscreen.addEventListener('fullscreenchange', updateCellEditorPosition);
        return () => fscreen.removeEventListener('fullscreenchange', updateCellEditorPosition);
    }, [])


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


    if (columnID === undefined || columnHeader === undefined) {
        return <></>;
    }

    const isFormulaColumn = props.sheetData.columnSpreadsheetCodeMap[columnID].length > 0;

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
            currentSheetView, props.gridState,
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
            arrowKeysScrollInFormula: false
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

            if (!endsInColumnHeader && isFormulaColumn && (arrowUp || arrowDown) && (suggestedColumnHeaders.length > 0 || suggestedFunctions.length > 0)) {
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
                        currentSheetView, props.gridState,
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
                currentSheetView, props.gridState,
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
        const index = props.sheetData.index[props.editorState.rowIndex];
        const formula = getFullFormula(props.editorState.formula, columnHeader, props.editorState.pendingSelectedColumns)

        // Mark this as loading
        setLoading(true);
        
        let errorMessage: MitoError | undefined = undefined;
        // Make sure to send the write type of message, depending on the editor
        if (isFormulaColumn) {
            errorMessage = await props.mitoAPI.editSetColumnFormula(
                props.selectedDataframeID,
                columnID,
                formula
            )
        } else {
            errorMessage = await props.mitoAPI.editSetCellValue(
                props.selectedDataframeID,
                columnID,
                index,
                formula
            )
        } 
        setLoading(false);

        // Don't let the user close the editor if this is an invalid formula
        // TODO: do we want a loading message?
        if (errorMessage === undefined) {
            closeCellEditor()
        } else {
            setCellEditorError(errorMessage.to_fix);
        }
    }

    return (
        <div 
            className='cell-editor' 
            style={{
                ...editorStyle,
                width: `${CELL_EDITOR_WIDTH}px`
            }}
        >
            <form
                className='cell-editor-form'
                onSubmit={onSubmit}
            >
                <input
                    ref={cellEditorInputRef}
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
                            '-', '+', '*', '/'
                        ]

                        // If we are typing at the end of the formula, and we type a CHARS_TO_REMOVE_SCROLL_IN_FORMULA,
                        // then we reset the arrowKeysScrollInFormula to false. Furtherrmore, if the formula is empty, 
                        // we reset the arrow keys to scroll in the sheet. Otherwise, we keep it as is.
                        // This attempts to match what Excel and Google Sheets do
                        const atEndOfFormula = (e.target.selectionStart || 0) >= e.target.value.length;
                        const finalChar = e.target.value.substring(e.target.value.length - 1);
                        const endsInResetCharacter = atEndOfFormula && CHARS_TO_REMOVE_SCROLL_IN_FORMULA.includes(finalChar)
                        const isEmpty = e.target.value.length === 0;
                        const arrowKeysScrollInFormula = props.editorState.arrowKeysScrollInFormula && !endsInResetCharacter && !isEmpty; 
                        
                        props.setEditorState({
                            ...props.editorState,
                            formula: e.target.value,
                            arrowKeysScrollInFormula: arrowKeysScrollInFormula
                        })}
                    }
                    autoFocus
                />
            </form>
            {/* 
                In the dropdown box, we either show an error, a loading message, suggestions
                or the documentation for the last function, depending on the cases below
            */}
            <div className='cell-editor-dropdown-box'>
                {cellEditorError === undefined && 
                    <p className={classNames('cell-editor-label', 'text-subtext-1', 'ml-5px')}>
                        {isFormulaColumn ? "You're setting the formula of this column" : "You're changing the value of this cell"}
                    </p>
                }
                {/* Show an error if there is currently an error */}
                {cellEditorError !== undefined &&
                    <div className='pl-10px pr-5px pt-5px pb-5px'>
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
                {cellEditorError === undefined && !loading && !endsInColumnHeader && isFormulaColumn &&
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
                            const subtextClassNames = classNames('cell-editor-suggestion-subtext', 'text-subtext-1');
                            
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
                                        <div className={subtextClassNames}>
                                            {subtext}
                                        </div>
                                    }
                                </div>
                            )
                        })}
                    </>
                }
                {/* Otherwise, display the documentation function */}
                {cellEditorError === undefined && !loading && isFormulaColumn && !hasSuggestions && documentationFunction !== undefined &&
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