import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import '../../../../css/endo/EndoGrid.css';
import '../../../../css/sitewide/colors.css';
import { MitoAPI } from "../../api/api";
import { EditorState, Dimension, GridState, RendererTranslate, SheetData, SheetView, UIState, MitoSelection, AnalysisData } from "../../types";
import FormulaBar from "./FormulaBar";
import { TaskpaneType } from "../taskpanes/taskpanes";
import { getCellEditorInputCurrentSelection, getStartingFormula } from "./celleditor/cellEditorUtils";
import ColumnHeaders from "./ColumnHeaders";
import EmptyGridMessages from "./EmptyGridMessages";
import { focusGrid } from "./focusUtils";
import GridData from "./GridData";
import IndexHeaders from "./IndexHeaders";
import { equalSelections, getColumnIndexesInSelections, getIndexesFromMouseEvent, getIsCellSelected, getIsHeader, getNewSelectionAfterKeyPress, getNewSelectionAfterMouseUp, getSelectedRowLabelsWithEntireSelectedRow, isNavigationKeyPressed, isSelectionsOnlyColumnHeaders, isSelectionsOnlyIndexHeaders, reconciliateSelections, removeColumnFromSelections } from "./selectionUtils";
import { calculateCurrentSheetView, calculateNewScrollPosition, calculateTranslate} from "./sheetViewUtils";
import { firstNonNullOrUndefined, getColumnIDsArrayFromSheetDataArray } from "./utils";
import { ensureCellVisible } from "./visibilityUtils";
import { reconciliateWidthDataArray } from "./widthUtils";
import FloatingCellEditor from "./celleditor/FloatingCellEditor";
import { SendFunctionStatus } from "../../api/send";
import { SearchBar } from "../SearchBar";
import { Actions } from "../../utils/actions";

// NOTE: these should match the css
export const DEFAULT_WIDTH = 123;
export const DEFAULT_HEIGHT = 25;
export const MIN_WIDTH = 50;

// The maximum number of rows sent in the sheet data by the backend
export const MAX_ROWS = 1500;


export const KEYS_TO_IGNORE_IF_PRESSED_ALONE = [
    'Shift',
    'Meta',
    'Alt',
    'Control',
    'CapsLock',
    'NumLock',
    'PageUp',
    'PageDown',
    'Unidentified' // If you press the fn key on windows, this is the key
]

export const KEYBOARD_SHORTCUTS_TO_IGNORE_WITH_CONTROL = [
    'c',
    'z',
    'y'
]

function EndoGrid(props: {
    sheetDataArray: SheetData[],
    sheetIndex: number,
    mitoAPI: MitoAPI,
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;

    /* 
        The state of the grid is represented by a viewport with a height and width,
        the scroll position of the scroller div in the viewport, and the selected 
        range of cells within the grid.

        We default the selection to -2s so that nothing is selected and all our selection
        code doesn't need to handle too many special cases.

        We store all of this state in a single object as if any of them change, the entire
        grid (the data, the headers) needs to rerender. Thus, we don't want to set them
        indivigually so that we can limit the amount of unnecessary rerendering we do.

        Only put state in here that causes a rerender of the entire grid when any element changes
        and is consistently passed as props to the grid and headers.
    */
    gridState: GridState,
    setGridState: React.Dispatch<React.SetStateAction<GridState>>,

    /* 
        If editorState is undefined, then the sheet is in normal navigation 
        mode. Otherwise, if editorState is not undefined, then the cell 
        editor is displaying, and all inputs may be captured and processed by
        the cell editor. 

        The way to think about this is that the sheet can be in two states; 
        1.  Navigation: when editorState is undefined.
        2.  Editing: when editorState is not undefined. 
        
        These will be processed different by many of the input handling functions,
        like mouse events, key events, etc.
    */
    editorState: EditorState | undefined,
    setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>
    mitoContainerRef: React.RefObject<HTMLDivElement>
    closeOpenEditingPopups: (taskpanesToKeepIfOpen?: TaskpaneType[]) => void;
    sendFunctionStatus: SendFunctionStatus;
    analysisData: AnalysisData;
    actions: Actions;
}): JSX.Element {

    // The container for the entire EndoGrid
    const containerRef = useRef<HTMLDivElement>(null);
    // The container for just the empty scroll div, and the rendered grid data
    const scrollAndRenderedContainerRef = useRef<HTMLDivElement | null>(null);
    // Store if the mouse is currently pressed down on the grid
    const [mouseDown, setMouseDown] = useState(false);
    // Store a resize observer so we can watch for viewport size changes, and size everything correctly off that
    const [resizeObserver, ] = useState(() => new ResizeObserver(() => {
        resizeViewport();
    }))
    
    // Destructure the props, so we access them more directly in the component below
    const {
        sheetDataArray, sheetIndex,
        gridState, setGridState, 
        editorState, setEditorState, 
        uiState, setUIState,
        mitoAPI
    } = props;

    const sheetData = sheetDataArray[sheetIndex];

    const totalSize: Dimension = {
        width: gridState.widthDataArray[gridState.sheetIndex]?.totalWidth || 0,
        height: DEFAULT_HEIGHT * Math.min(sheetData?.numRows || 0, MAX_ROWS)
    }
    
    const currentSheetView: SheetView = useMemo(() => {
        return calculateCurrentSheetView(gridState)
    }, [gridState])

    const translate: RendererTranslate = useMemo(() => {
        return calculateTranslate(gridState);
    }, [gridState])

    /* 
        An effect that handles the sheet data changing, in which case
        we have to perform a reconciliation of width data, as well 
        as the selection

        Columns may have been deleted or added. We need to make sure that
        the widths and selection track these changes correctly.
    */
    useEffect(() => {
        setGridState(gridState => {
            return {
                ...gridState,
                selections: reconciliateSelections(gridState.sheetIndex, sheetIndex, gridState.selections, gridState.columnIDsArray[gridState.sheetIndex], sheetData),
                widthDataArray: reconciliateWidthDataArray(gridState.widthDataArray, gridState.columnIDsArray, sheetDataArray),
                columnIDsArray: getColumnIDsArrayFromSheetDataArray(sheetDataArray),
                sheetIndex: sheetIndex,
                // We always clear the copied selections if the sheet data changes, or the selected sheet changes
                copiedSelections: []
            }
        })
    }, [sheetData, setGridState, sheetIndex])

    // A helper function that should be run when the viewport changes sizes
    const resizeViewport = () => {
        setGridState((gridState) => {
            const scrollAndRenderedContainerDiv = scrollAndRenderedContainerRef?.current;
            if (scrollAndRenderedContainerDiv) {
                const newViewport = {
                    width: scrollAndRenderedContainerDiv.clientWidth,
                    height: scrollAndRenderedContainerDiv.clientHeight,
                }
                return {
                    ...gridState,
                    viewport: newViewport
                }
            }
            return gridState;
        })
    };


    // This hook is used to set the scrollAndRenderedContainerRef, while also
    // registering this element with the resize observer, so that we can make sure
    // to update the viewport size when we need to      
    const setScrollAndRendererContainerRef = useCallback((unsavedScrollAndRenderedContainerDiv: HTMLDivElement) => {
        if (unsavedScrollAndRenderedContainerDiv !== null) {
            scrollAndRenderedContainerRef.current = unsavedScrollAndRenderedContainerDiv;
            resizeObserver.observe(unsavedScrollAndRenderedContainerDiv)
        }
    },[]);

    // An effect that cleans up the resize observer
    useEffect(() => {
        return () => {resizeObserver.disconnect();}
    }, [])

    // Handles a scroll inside the grid 
    const onGridScroll = (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
        const newScrollPosition = calculateNewScrollPosition(
            e,
            totalSize,
            gridState.viewport,
            scrollAndRenderedContainerRef.current
        )

        if (newScrollPosition !== undefined) {
            setGridState((gridState) => {
                return {
                    ...gridState,
                    scrollPosition: newScrollPosition
                }
            })
        }
    };


    const onMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {

        if (editorState !== undefined) {
            // EDITING MODE

            const {rowIndex, columnIndex} = getIndexesFromMouseEvent(e);

            // If we're editing a column header:
            // 1. And we click on that header being edited, we don't want to add that as pending
            // 2. And we click on a different cell, that will just onBlur the column header editor
            //    and close it, so we don't want to add that selection as pending either
            if (editorState.rowIndex === -1) {
                return;
            }

            if (columnIndex !== undefined && sheetData?.data[columnIndex] !== undefined) {

                // Get the column that was clicked, and then find the current selection
                // within the cell editor, so that we can place the column header correctly
                // If the cell cellEditor is open, then look inside the EndoGrid, otherwise look inside the mitoContainer
                const cellEditorContainer = editorState.editorLocation === 'cell' ? containerRef.current : props.mitoContainerRef.current
                const {selectionStart, selectionEnd} = getCellEditorInputCurrentSelection(cellEditorContainer);
            
                // If there is already some suggested column headers, we do not change this selection, 
                // as we want any future expanded selection of column headers to overwrite the same 
                // region. So default to pendingSelections?.selectionStart, but if this does not
                // exist, than take the selection range in the input currently
                const newInputSelectionStart = firstNonNullOrUndefined(
                    editorState.pendingSelections?.inputSelectionStart,
                    selectionStart
                )
                const newInputSelectionEnd = firstNonNullOrUndefined(
                    editorState.pendingSelections?.inputSelectionEnd,
                    selectionEnd
                )

                // If the user is holding down the shift key, we want to extend the selection
                // rather than starting from scratch with a new selection
                let startingColumnIndex = props.editorState?.pendingSelections?.selections[0].startingColumnIndex ?? columnIndex;
                let endingColumnIndex = props.editorState?.pendingSelections?.selections[0].endingColumnIndex ?? columnIndex;
                if (e.shiftKey && startingColumnIndex > columnIndex) {
                    startingColumnIndex = columnIndex;
                } else if (e.shiftKey && endingColumnIndex < columnIndex) {
                    endingColumnIndex = columnIndex;
                } else if (!e.shiftKey) {
                    startingColumnIndex = columnIndex;
                    endingColumnIndex = columnIndex;
                }
                const newSelection: MitoSelection[] = [{
                    startingRowIndex: rowIndex !== undefined ? rowIndex : -1,
                    endingRowIndex: rowIndex !== undefined ? rowIndex : -1,
                    startingColumnIndex: startingColumnIndex,
                    endingColumnIndex: endingColumnIndex,
                    sheetIndex: sheetIndex,
                }]

                // Select the column that was clicked on, as they do in Excel
                setGridState(prevGridState => {
                    return {
                        ...prevGridState,
                        selections: newSelection
                    }
                })

                return setEditorState({
                    ...editorState,
                    pendingSelections: {
                        selections: newSelection,
                        inputSelectionStart: newInputSelectionStart,
                        inputSelectionEnd: newInputSelectionEnd
                    },
                    /* If you click on a cell, you should now scroll in the sheet */
                    arrowKeysScrollInFormula: false
                });
            }
            return;
        } else {
            // NAVIGATION MODE

            // First, we make sure that the grid is focused on
            focusGrid(containerRef.current);

            // Set state so we know mouse is down
            setMouseDown(true);

            // Update the selection
            const {rowIndex, columnIndex} = getIndexesFromMouseEvent(e);

            // If the click was not on a cell, return
            if (rowIndex === undefined || columnIndex === undefined) {
                return;
            }

            // If this is a right click, and we're selecting within a range that is already selected,
            // then the user is likely trying to open a context menu, so we don't change the selection
            if (e.button === 2 && getIsCellSelected(gridState.selections, rowIndex, columnIndex)) {
                return;
            }
            

            if (e.metaKey || e.ctrlKey) {
                /* 
                    These are the cases where we add a new selection. A user can add to their selection by:
                    1. Being on Mac, and command+clicking
                    2. Being on Windows, and ctrl+clicking
                */

                if (e.shiftKey) {
                    // Just add the new click locaton to a new selection at the end of the selections list
                    setGridState((gridState) => {
                        const selectionsCopy = [...gridState.selections]
                        selectionsCopy.push({
                            startingRowIndex: rowIndex,
                            endingRowIndex: rowIndex,
                            startingColumnIndex: columnIndex,
                            endingColumnIndex: columnIndex,
                            sheetIndex: sheetIndex,
                        })
                        return {
                            ...gridState,
                            selections: selectionsCopy
                        }
                    })
                // The next step of conditions handle when meta or ctrl key is pressed and shift is not
                } else {
                    if (rowIndex === -1) {
                        // If column is in selection, then remove it
                        // By passing -1 as the row index, getIsCellSelected checks if the entire column is selected
                        if (getIsCellSelected(gridState.selections, -1, columnIndex)) {
                            setGridState((gridState) => {
                                return {
                                    ...gridState,
                                    selections: removeColumnFromSelections(gridState.selections, columnIndex)
                                }
                            })
                        } else {
                            // If column is not in selection, append a new selection
                            setGridState((gridState) => {
                                const selectionsCopy = [...gridState.selections]
                                selectionsCopy.push({
                                    startingRowIndex: rowIndex,
                                    endingRowIndex: rowIndex,
                                    startingColumnIndex: columnIndex,
                                    endingColumnIndex: columnIndex,
                                    sheetIndex: sheetIndex,
                                })
                                return {
                                    ...gridState,
                                    selections: selectionsCopy
                                }
                            })
                        }
                    } else {
                        // If the row, col they clicked in not in the selection, then append it to the end 
                        if (!getIsCellSelected(props.gridState.selections, rowIndex, columnIndex)) {
                            const selectionsCopy = [...gridState.selections]
                            selectionsCopy.push({
                                startingRowIndex: rowIndex,
                                endingRowIndex: rowIndex,
                                startingColumnIndex: columnIndex,
                                endingColumnIndex: columnIndex,
                                sheetIndex: sheetIndex,
                            })
                            setGridState((gridState) => {
                                return {
                                    ...gridState,
                                    selections: selectionsCopy
                                }
                            })
                        } else {
                            // If the (row, col) is in the selections, then make the selections just this element
                            // TODO: In the future, this should deselect the specific cell that they clicked on.
                            setGridState((gridState) => {
                                return {
                                    ...gridState,
                                    selections: [{
                                        startingRowIndex: rowIndex,
                                        endingRowIndex: rowIndex,
                                        startingColumnIndex: columnIndex,
                                        endingColumnIndex: columnIndex,
                                        sheetIndex: sheetIndex,
                                    }]
                                }
                            })
                        }
                    }
                }
                return;
            } else {
                if (e.shiftKey) {
                    // If the shift key is down, we extend the current selection
                    const selectionsCopy = [...gridState.selections]
                    selectionsCopy[selectionsCopy.length - 1] = getNewSelectionAfterMouseUp(selectionsCopy[selectionsCopy.length - 1], rowIndex, columnIndex)
                    setGridState((gridState) => {
                        return {
                            ...gridState,
                            selections: selectionsCopy
                        }
                    })
                } else {
                    // Clear the entire selection, and create a new one. 
                    setGridState((gridState) => {
                        return {
                            ...gridState,
                            selections: [{
                                startingRowIndex: rowIndex,
                                endingRowIndex: rowIndex,
                                startingColumnIndex: columnIndex,
                                endingColumnIndex: columnIndex,
                                sheetIndex: sheetIndex,
                            }]
                        }
                    })
                }
            }

            // If the user is clicking on the index column, we make sure to close the control
            // panel if it's open, so we don't display something empty
            if (columnIndex === -1) {
                setUIState(prevUIState => {
                    if (prevUIState.currOpenTaskpane.type === TaskpaneType.CONTROL_PANEL) {
                        return {
                            ...prevUIState, 
                            currOpenTaskpane: {type: TaskpaneType.NONE}
                        }
                    }
                    return prevUIState;
                })
            }
        }
    }


    const onMouseUp = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        // TODO: Figure out why this doesn't get triggered when the user is pressing
        // the shift key. It results in weird behavior where if the user
        // has pressed the shift key to make a selection, the selection box
        // follows their cursor, even once they have lifted their mouse up.

        // Do nothing, if we're in EDITING mode. Clicks handled by onMouseDown
        if (editorState !== undefined) {
            return;
        }

        // Make sure the grid is focused
        focusGrid(containerRef.current);

        // Mark that the mouse is no longer down
        setMouseDown(false);

        const {rowIndex, columnIndex} = getIndexesFromMouseEvent(e);

        // If the shift key or metaKey is down, then this is handled by the onMouseDown
        if (e.shiftKey || e.metaKey) {
            return;
        }

        // If this is a right click, and we're selecting within a range that is already selected,
        // then the user is likely trying to open a context menu, so we don't change the selection
        if (e.button === 2 && rowIndex && columnIndex && getIsCellSelected(gridState.selections, rowIndex, columnIndex)) {
            return;
        }

        const newLastSelection = getNewSelectionAfterMouseUp(gridState.selections[gridState.selections.length - 1], rowIndex, columnIndex);
        const newSelections = [...gridState.selections]
        newSelections[newSelections.length - 1] = newLastSelection
        // We only update the selection if has changed, so we don't rerender unnecessarily
        if (!equalSelections(newLastSelection, gridState.selections[gridState.selections.length - 1])) {
            setGridState((gridState) => {
                return {
                    ...gridState,
                    selections: newSelections
                }
            })
        }
    }

    // An effect so that when the mouse is down, the selection tracks where
    // the mouse is and updates live
    useEffect(() => {
        if (mouseDown) {
            const updateSelectionOnMouseDrag = (e: MouseEvent) => {

                const {rowIndex, columnIndex} = getIndexesFromMouseEvent(e);
                
                setGridState((gridState) => {
                    const newLastSelection = getNewSelectionAfterMouseUp(gridState.selections[gridState.selections.length - 1], rowIndex, columnIndex);
                    const newSelections = [...gridState.selections]
                    newSelections[newSelections.length - 1] = newLastSelection
                    return {
                        ...gridState,
                        selections: newSelections
                    }
                })
            }
            const containerDiv = containerRef.current; 

            // We don't allow the drag and drop selections if you're starting from a column 
            // header, because the headers themselves are draggable and droppable
            if (gridState.selections[gridState.selections.length - 1].startingRowIndex === -1) {
                return;
            }

            containerDiv?.addEventListener('mousemove', updateSelectionOnMouseDrag);
            return () => {
                containerDiv?.removeEventListener('mousemove', updateSelectionOnMouseDrag)
            }
        }
    }, [mouseDown, gridState, setGridState])

    // On double click, open the cell editor on this cell
    const onDoubleClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const {rowIndex, columnIndex} = getIndexesFromMouseEvent(e);
        // Don't open for headers
        if ((rowIndex === undefined || columnIndex === undefined) || getIsHeader(rowIndex, columnIndex)) {
            return;
        }

        const {startingColumnFormula, arrowKeysScrollInFormula, editingMode} = getStartingFormula(sheetData, props.editorState, rowIndex, columnIndex);

        setEditorState({
            rowIndex: rowIndex,
            columnIndex: columnIndex,
            formula: startingColumnFormula,
            arrowKeysScrollInFormula: arrowKeysScrollInFormula,
            editorLocation: 'cell',
            editingMode: editingMode,
            sheetIndex: sheetIndex,
        })
    }
    

    // Effect listeners for when keys are pressed
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {

            // If we're in editing mode, then we don't do anything with the keyboard 
            // events as they are handeled by the cell editor state machine!
            if (editorState !== undefined) {
                return;
            }
            
            if (KEYS_TO_IGNORE_IF_PRESSED_ALONE.includes(e.key)) {
                return;
            }
            if (KEYBOARD_SHORTCUTS_TO_IGNORE_WITH_CONTROL.includes(e.key) || (e.ctrlKey)) {
                return;
            }

            if (!isNavigationKeyPressed(e.key)) {
                
                
                // If the metaKey is pressed, the user might be refreshing the page for example, 
                // so we just return here
                if (e.metaKey || e.key === 'Escape') {
                    return;
                }

                if ((e.key === 'Backspace' || e.key === 'Delete')) {
                    if (isSelectionsOnlyColumnHeaders(gridState.selections)) {
                        // If the key pressed backspace or delete key, and the user is selecting some column headers,
                        // then we delete the columns they have selected
                        const columnIndexesSelected = getColumnIndexesInSelections(gridState.selections);
                        const columnIDsToDelete = columnIndexesSelected.map(colIdx => sheetData?.data[colIdx]?.columnID)

                        if (columnIDsToDelete !== undefined) {
                            props.closeOpenEditingPopups();
                            void mitoAPI.editDeleteColumn(
                                sheetIndex,
                                columnIDsToDelete
                            )
                        }

                        return;
                    } else if (isSelectionsOnlyIndexHeaders(gridState.selections)) {
                        // Similarly, if the user has only index headers selected, we can delete them
                        void props.mitoAPI.editDeleteRow(props.sheetIndex, getSelectedRowLabelsWithEntireSelectedRow(gridState.selections, sheetData));
                        return;
                    }
                    
                } 

                // If we press any key that is not a navigation key, then we open the editor
                setGridState((gridState) => {
                    const lastSelection = gridState.selections[gridState.selections.length - 1]

                    const {startingColumnFormula, arrowKeysScrollInFormula, editingMode} = getStartingFormula(sheetData, undefined, lastSelection.startingRowIndex, lastSelection.startingColumnIndex, e);
                    
                    setEditorState({
                        rowIndex: lastSelection.startingRowIndex,
                        columnIndex: lastSelection.startingColumnIndex,
                        formula: startingColumnFormula,
                        arrowKeysScrollInFormula: arrowKeysScrollInFormula,
                        editorLocation: 'cell',
                        editingMode: editingMode,
                        sheetIndex: sheetIndex,
                    });

                    e.preventDefault();

                    return {
                        ...gridState,
                        selections: [{
                            startingRowIndex: lastSelection.startingRowIndex,
                            endingRowIndex: lastSelection.startingRowIndex,
                            startingColumnIndex: lastSelection.startingColumnIndex,
                            endingColumnIndex: lastSelection.startingColumnIndex,
                            sheetIndex: sheetIndex,
                        }]
                    }
                })
                
                return;
            } else {
                // Otherwise, a navigation key was pressed, and so we should navigate!

                // Prevent the default of the key (to scroll or tab)
                e.preventDefault()

                // Update the selection
                setGridState((gridState) => {
                    const newSelection = getNewSelectionAfterKeyPress(gridState.selections[gridState.selections.length - 1], e, sheetData);
                    ensureCellVisible(
                        containerRef.current, scrollAndRenderedContainerRef.current,
                        currentSheetView, gridState,
                        newSelection.endingRowIndex, newSelection.endingColumnIndex
                    );

                    return {
                        ...gridState,
                        selections: [newSelection]
                    };
                })

            }
        }

        const containerDiv = containerRef.current; 
        containerDiv?.addEventListener('keydown', onKeyDown);
        return () => containerDiv?.removeEventListener('keydown', onKeyDown)
    }, [editorState, setEditorState, sheetData, currentSheetView, mitoAPI, gridState.selections, sheetIndex, setGridState])


    return (
        <>
            <FormulaBar
                sheetDataArray={sheetDataArray}
                selection={gridState.selections[gridState.selections.length - 1]}
                sheetIndex={props.sheetIndex}
                editorState={editorState}
                setEditorState={props.setEditorState}
                gridState={props.gridState}
                setGridState={props.setGridState}
                setUIState={props.setUIState}
                scrollAndRenderedContainerRef={scrollAndRenderedContainerRef}
                containerRef={containerRef}
                mitoAPI={props.mitoAPI}
                closeOpenEditingPopups={props.closeOpenEditingPopups}
                analysisData={props.analysisData}
                mitoContainerRef={props.mitoContainerRef}
            />
            <div 
                className='endo-grid-container' 
                ref={containerRef}
                tabIndex={-1} 
                onMouseDown={onMouseDown} 
                onMouseUp={onMouseUp} 
                onMouseLeave={() => setMouseDown(false)}
                onDoubleClick={onDoubleClick}
            >
                {sheetData !== undefined &&
                    <>
                        <ColumnHeaders
                            sheetData={sheetData}
                            uiState={uiState}
                            setUIState={setUIState}
                            sheetIndex={sheetIndex}
                            containerRef={containerRef}
                            editorState={editorState}
                            setEditorState={setEditorState}
                            scrollAndRenderedContainerRef={scrollAndRenderedContainerRef}
                            gridState={gridState}
                            setGridState={setGridState}
                            mitoAPI={mitoAPI}
                            closeOpenEditingPopups={props.closeOpenEditingPopups}
                            actions={props.actions}
                        />
                        <IndexHeaders
                            sheetData={sheetData}
                            gridState={gridState}
                            mitoAPI={mitoAPI}
                            closeOpenEditingPopups={props.closeOpenEditingPopups}
                            sheetIndex={sheetIndex}
                        />
                    </>
                }
                
                <div className="endo-scroller-and-renderer-container" ref={setScrollAndRendererContainerRef} onScroll={onGridScroll}>
                    {/* 
                        We handle the case where this no data in the sheet just by returning an empty
                        container with an optional message of your choosing! 

                        Note that we do not return this in a different return statement, as we always
                        want the refs defined on these components to be defined (even if there is no 
                        data). This simplifies logic in handling refs going from not defined to defined,
                        if a user renders an empty sheet, then adds data to it.
                    */}
                    <EmptyGridMessages
                        setUIState={props.setUIState}
                        sheetData={sheetData}
                        mitoAPI={mitoAPI}
                        uiState={props.uiState}
                        sendFunctionStatus={props.sendFunctionStatus}
                    />
                    {/* 
                        This is the div we actually scroll inside. We make it so it's styled
                        to be the size of all the data if it was displayed.
                    */}
                    <div 
                        id='scroller' 
                        style={{
                            height: `${totalSize.height}px`,
                            width: `${totalSize.width}px`
                        }} 
                    />
                    {/* We use the rendererStyle to move the grid data to the right location */}
                    <div 
                        className="endo-renderer-container" 
                        style={{
                            transform: `translate(${gridState.scrollPosition.scrollLeft - translate.x}px, ${gridState.scrollPosition.scrollTop - translate.y}px)`,
                        }}
                        onContextMenu={() => {
                            // We also log if the user tries to right click on the sheet data
                            void props.mitoAPI.log('right_clicked_on_sheet_data');
                        }}
                    >
                        <GridData
                            sheetData={sheetData}
                            gridState={gridState}
                            uiState={uiState}
                            editorState={editorState}
                        />
                    </div>
                </div>
                {sheetData !== undefined && editorState !== undefined && editorState.editorLocation === 'cell' && editorState.rowIndex > -1 &&
                    <FloatingCellEditor
                        sheetDataArray={sheetDataArray}
                        sheetIndex={sheetIndex}
                        gridState={gridState}
                        editorState={editorState}
                        setGridState={setGridState}
                        setEditorState={setEditorState}
                        setUIState={setUIState}
                        scrollAndRenderedContainerRef={scrollAndRenderedContainerRef}
                        containerRef={containerRef}
                        mitoAPI={mitoAPI}
                        closeOpenEditingPopups={props.closeOpenEditingPopups}
                        analysisData={props.analysisData}
                        mitoContainerRef={props.mitoContainerRef}
                    />
                }
            </div>
            {uiState.currOpenSearch.isOpen &&
                <SearchBar
                    uiState={uiState}
                    setUIState={setUIState}
                    mitoAPI={mitoAPI}
                    containerDiv={containerRef.current}
                    scrollAndRenderedContainerDiv={scrollAndRenderedContainerRef.current}
                    sheetView={currentSheetView}
                    gridState={gridState}
                    setGridState={setGridState}
                    sheetData={sheetData}
                />
            }
        </>
    )
}

export default EndoGrid;
