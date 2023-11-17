import React, { useEffect, useRef, useState } from 'react';
import '../../../../css/endo/ColumnHeaders.css';
import { getChildrenWithQuery } from './domUtils';
import { MIN_WIDTH } from './EndoGrid';
import { getIndexesFromXAndY } from './selectionUtils';
import { calculateCurrentSheetView, calculateTranslate } from './sheetViewUtils';
import { EditorState, GridState, SheetData, UIState } from '../../types';
import { MitoAPI } from '../../api/api';
import { classNames } from '../../utils/classNames';
import ColumnHeader from './ColumnHeader';
import { changeColumnWidthDataArray } from './widthUtils';
import { TaskpaneType } from '../taskpanes/taskpanes';
import { Actions } from '../../utils/actions';


/* 
    The container for the headers at the top of the sheet, with support
    for resizing and for reordering them.
*/
const ColumnHeaders = (props: {
    sheetIndex: number,
    sheetData: SheetData,
    gridState: GridState,
    editorState: EditorState | undefined;
    setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>;
    containerRef: React.RefObject<HTMLDivElement>;
    scrollAndRenderedContainerRef: React.RefObject<HTMLDivElement>; 
    setGridState: React.Dispatch<React.SetStateAction<GridState>>;
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    mitoAPI: MitoAPI;
    closeOpenEditingPopups: (taskpanesToKeepIfOpen?: TaskpaneType[]) => void;
    actions: Actions;
}): JSX.Element => {
        
    // The div that stores all the column headers
    const columnHeadersContainerRef = useRef<HTMLDivElement>(null);

    // Store what the current operation being performed
    // on the column is, so we can conditionally change the css
    const [columnHeaderOperation, setColumnHeaderOperation] = useState<'resize' | 'reorder' | undefined>(undefined);

    // The amount we should be scrolling in either direction, in the case
    // that we want to scroll the div when a user is dragging a header
    // to a new location
    const [scrollAmount, setScrollAmount] = useState<number | undefined>(undefined); 

    // Effect to scroll the grid when scrollAmount is set
    useEffect(() => {
        if (scrollAmount !== undefined) {
            const interval = setInterval(() => {
                props.scrollAndRenderedContainerRef.current?.scrollBy(
                    {
                        left: scrollAmount
                    }
                )
            }, 10)

            return () => {clearInterval(interval)}            
        }
    }, [props.scrollAndRenderedContainerRef, scrollAmount])

    const currentSheetView = calculateCurrentSheetView(props.gridState);
    const translate = calculateTranslate(props.gridState);
    const columnHeaderStyle = {transform: `translateX(${-translate.x}px)`}

    return (
        <>
            {props.sheetData.numColumns > 0 && 
                <div 
                    className={classNames("endo-column-headers-container", {
                        'endo-column-headers-no-operation': columnHeaderOperation === undefined,
                        'endo-column-headers-resizing': columnHeaderOperation === 'resize'
                    })}
                    ref={columnHeadersContainerRef}

                    /* 
                        On drag over handles two things: scrolling the grid when the user
                        is dragging a column to a new location and they are
                        at the end of the grid, and highlighting the border between columns
                        where the column would be inserted.

                        Because we cannot access the element that is being dragged
                        in the onDragOver event (or the dataTransfer data), we simply
                        have to just scroll in every case.

                        See here: https://stackoverflow.com/questions/11065803/determine-what-is-being-dragged-from-dragenter-dragover-events
                    */
                    onDragOver={(e) => {
                        // Prevent the default, so we can drop on this element
                        e.preventDefault()
                        e.persist()

                        // First we handle highlighting the border
                        const {columnIndex} = getIndexesFromXAndY(e.clientX, e.clientY)
                        if (columnHeaderOperation === 'reorder' && columnIndex !== props.uiState.highlightedColumnIndex) {
                            props.setUIState({ ...props.uiState, highlightedColumnIndex: columnIndex });
                        }

                        // Handle scrolling
                        const leftInHeader = e.clientX - (columnHeadersContainerRef.current?.getBoundingClientRect().left || 0) 
                        if (leftInHeader < 100) {
                            // Scale the offset so we scroll more aggressively as you get closer 
                            // to the edge
                            const offsetScale = 1 - leftInHeader / 100;
                            setScrollAmount(-25 * offsetScale);
                        } else if (leftInHeader > (columnHeadersContainerRef.current?.getBoundingClientRect().width || 0) - 100) {
                            const offsetScale = 1 - ((columnHeadersContainerRef.current?.getBoundingClientRect().width || 0) - leftInHeader) / 100;
                            setScrollAmount(25 * offsetScale);
                        } else {
                            setScrollAmount(undefined);
                        }                                              
                    }
                    }


                    /* 
                        Handles when a user drops something they have been dragging on
                        top of the column headers. This can either be a column header
                        resizer (in which case we resize), or a column header itself,
                        in which case we move the column header.
                    */
                    onDrop={e => {  
                        e.preventDefault()

                        // Clear the scroll amount, just in case
                        setScrollAmount(undefined);

                        const clientX = e.clientX;
                        const clientY = e.clientY;

                        const operation = e.dataTransfer.getData("operation");
                        const columnIndexString = e.dataTransfer.getData("mito-col-index");

                        if (operation === '' || columnIndexString === '') {
                            return
                        }


                        const dragColumnIndex = parseInt(columnIndexString);
                        
                        if (operation === 'resize') {
                            // Get the column header container itself - note the class query
                            const columnHeaderDivs = getChildrenWithQuery(props.containerRef.current, `.endo-column-header-container[mito-col-index="${dragColumnIndex}"]`)
                            if (columnHeaderDivs.length === 0) {return}
                            const columnHeaderDiv = columnHeaderDivs[0] as HTMLDivElement;

                            // The new width is the distance from the column header
                            // but don't let it be less than the min width
                            const newWidth = Math.max(e.clientX - columnHeaderDiv.getBoundingClientRect().left, MIN_WIDTH);
                            props.setGridState((gridState) => {
                                return {
                                    ...gridState,
                                    widthDataArray: changeColumnWidthDataArray(props.sheetIndex, props.gridState.widthDataArray, dragColumnIndex, newWidth)
                                }
                            })
                        } else if (operation === 'reorder') {
                            // First, we find the column that we were moving
                            const startingColumnIndex = dragColumnIndex;

                            // Then, we find the column that we moved it to
                            const {columnIndex} = getIndexesFromXAndY(clientX, clientY)
                            const columnIDToReorder = props.sheetData.data[startingColumnIndex].columnID;

                            if (dragColumnIndex === columnIndex) {
                                return;
                            }
    
                            if (columnIndex === undefined || columnIDToReorder === undefined) {
                                return;
                            }

                            void props.mitoAPI.editReorderColumn(props.sheetIndex, columnIDToReorder, columnIndex);
                            
                            // We close any open taskpanes if we reorder something, so we don't get bugs where
                            // pivot is open and then the user tries to overwrite the wrong step
                            props.setUIState(prevUIState => {
                                return {
                                    ...prevUIState,
                                    highlightedColumnIndex: undefined,
                                    currOpenTaskpane: {type: TaskpaneType.NONE}
                                }
                            })

                            props.setGridState(gridState => {
                                return {
                                    ...gridState,
                                    selection: {
                                        ...gridState.selections,
                                        startingColumnIndex: columnIndex,
                                        endingColumnIndex: columnIndex
                                    }
                                }
                            })
                        }
                    }}

                    /* Make sure the scroll amount is cleared, so we don't get stuck scrolling */
                    onMouseLeave={() => {setScrollAmount(undefined)}}
                    onMouseUp={() => {setScrollAmount(undefined)}}
                >
                    <div style={columnHeaderStyle}>
                        {Array(currentSheetView.numColumnsRendered).fill(0).map((_, _colIndex) => {
                            const columnIndex = currentSheetView.startingColumnIndex + _colIndex;
                            return (
                                <ColumnHeader
                                    key={columnIndex}
                                    columnIndex={columnIndex}
                                    sheetData={props.sheetData}
                                    gridState={props.gridState}
                                    setGridState={props.setGridState}
                                    editorState={props.editorState}
                                    setEditorState={props.setEditorState}
                                    containerRef={props.containerRef}
                                    columnHeaderOperation={columnHeaderOperation}
                                    setColumnHeaderOperation={setColumnHeaderOperation}
                                    uiState={props.uiState}
                                    setUIState={props.setUIState}
                                    mitoAPI={props.mitoAPI}
                                    closeOpenEditingPopups={props.closeOpenEditingPopups}
                                    actions={props.actions}
                                />
                            )
                        })}
                    </div>
                </div>
            }
        </>
    )
}

export default React.memo(ColumnHeaders);