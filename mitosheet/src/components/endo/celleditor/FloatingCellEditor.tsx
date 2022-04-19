import fscreen from 'fscreen';
import React, { useEffect, useState } from 'react';
import MitoAPI from '../../../api';
import { EditorState, GridState, SheetData } from '../../../types';
import { isPrimitiveColumnHeader } from '../../../utils/columnHeaders';
import CellEditor, { CELL_EDITOR_WIDTH } from './CellEditor';
import { calculateCurrentSheetView, getCellInColumn, getCellInRow } from '../sheetViewUtils';
import { getCellDataFromCellIndexes } from '../utils';
import '../../../../css/endo/CellEditor.css';

// Style that we apply to the cell editor in order to place it
interface EditorStyle {top?: number, left?: number, bottom?: number, right?: number, display?: string}

/* 
    The container for the headers at the top of the sheet, with support
    for resizing and for reordering them.
*/
const FloatingCellEditor = (props: {
    sheetData: SheetData,
    sheetIndex: number,
    gridState: GridState,
    editorState: EditorState,
    setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>,
    setGridState: React.Dispatch<React.SetStateAction<GridState>>,
    scrollAndRenderedContainerRef: React.RefObject<HTMLDivElement>,
    containerRef: React.RefObject<HTMLDivElement>,
    mitoAPI: MitoAPI,
}): JSX.Element => {

    const [editorStyle, setEditorStyle] = useState<EditorStyle>({
        top: 0,
        left: 0,
        display: 'none'
    })

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


    if (columnID === undefined || columnHeader === undefined) {
        return <></>;
    }

    return (
        <div 
            className={'floating-cell-editor'}
            style={{
                ...editorStyle,
                width: `${CELL_EDITOR_WIDTH}px`
            }}
        >
            <CellEditor 
                sheetData={props.sheetData}
                sheetIndex={props.sheetIndex}
                gridState={props.gridState}
                editorState={props.editorState}
                setEditorState={props.setEditorState}
                setGridState={props.setGridState}
                scrollAndRenderedContainerRef={props.scrollAndRenderedContainerRef}
                containerRef={props.containerRef}
                mitoAPI={props.mitoAPI}
                currentSheetView={currentSheetView}
            />
        </div>
    )
}

export default FloatingCellEditor