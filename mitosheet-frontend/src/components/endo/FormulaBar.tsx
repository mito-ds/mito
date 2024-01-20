// Copyright (c) Mito

import React from 'react';

// Import css
import "../../../css/FormulaBar.css";
import "../../../css/mito.css";
import { MitoAPI } from '../../api/api';
import { AnalysisData, EditorState, GridState, MitoSelection, SheetData, UIState } from '../../types';
import { getDisplayColumnHeader } from '../../utils/columnHeaders';
import Col from '../layout/Col';
import Row from '../layout/Row';
import { TaskpaneType } from '../taskpanes/taskpanes';
import CellEditor from './celleditor/CellEditor';
import { getFullFormula } from './celleditor/cellEditorUtils';
import { calculateCurrentSheetView } from './sheetViewUtils';
import { getCellDataFromCellIndexes } from './utils';

const FormulaBar = (props: {
    sheetDataArray: SheetData[],
    sheetIndex: number,
    gridState: GridState,
    editorState: EditorState | undefined,
    setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>,
    setGridState: React.Dispatch<React.SetStateAction<GridState>>,
    setUIState: React.Dispatch<React.SetStateAction<UIState>>,
    scrollAndRenderedContainerRef: React.RefObject<HTMLDivElement>,
    containerRef: React.RefObject<HTMLDivElement>,
    mitoAPI: MitoAPI,
    selection: MitoSelection,
    closeOpenEditingPopups: (taskpanesToKeepIfOpen?: TaskpaneType[]) => void;
    analysisData: AnalysisData,
    mitoContainerRef: React.RefObject<HTMLDivElement>,
}): JSX.Element => {

    const rowIndex = props.selection.startingRowIndex
    const colIndex = props.selection.startingColumnIndex
    const sheetData = props.sheetDataArray[props.editorState?.sheetIndex ?? props.sheetIndex];
    const {columnHeader, columnFormula, cellValue, columnFormulaLocation} = getCellDataFromCellIndexes(sheetData, rowIndex, colIndex);
    const originalFormulaBarValue = '' + (columnFormula !== undefined && columnFormula !== '' ? columnFormula : (cellValue !== undefined ? cellValue : ''));
    const cellEditingCellData = props.editorState === undefined ? undefined : getCellDataFromCellIndexes(sheetData, props.editorState.rowIndex, props.editorState.columnIndex);
    const formulaBarColumnHeader = props.editorState === undefined ? columnHeader : cellEditingCellData?.columnHeader;

    let formulaBarValue = ''
    if (props.editorState === undefined) {
        // If the formula bar is a cell, display the cell value. If it is a column header, display the column header
        if (rowIndex == -1 && columnHeader !== undefined) {
            formulaBarValue = getDisplayColumnHeader(columnHeader)
        } else {
            formulaBarValue = originalFormulaBarValue;
        }
    } else {
        // If we're editing, display the formula
        formulaBarValue = getFullFormula(props.editorState, props.sheetDataArray, props.sheetIndex);
    }

    const currentSheetView = calculateCurrentSheetView(props.gridState);

    return(
        <Row 
            align='center'
            suppressTopBottomMargin
            className='formula-bar'
        >
            <Col offset={.5}>
                <p className="formula-bar-column-header text-header-3 text-overflow-hide">
                    {formulaBarColumnHeader}
                </p>
            </Col>
            <Col>
                <div className="formula-bar-vertical-line"/>
            </Col>
            <Col flex='1'>
                {props.editorState?.editorLocation === 'formula bar' &&
                    <CellEditor
                        sheetDataArray={props.sheetDataArray}
                        sheetIndex={props.sheetIndex}
                        gridState={props.gridState}
                        editorState={props.editorState}
                        setEditorState={props.setEditorState}
                        setGridState={props.setGridState}
                        setUIState={props.setUIState}
                        scrollAndRenderedContainerRef={props.scrollAndRenderedContainerRef}
                        containerRef={props.containerRef}
                        mitoAPI={props.mitoAPI}
                        currentSheetView={currentSheetView}
                        closeOpenEditingPopups={props.closeOpenEditingPopups}
                        analysisData={props.analysisData}
                        mitoContainerRef={props.mitoContainerRef}
                    />
                } 
                {props.editorState?.editorLocation !== 'formula bar' &&
                    <div 
                        className="formula-bar-formula text-header-3 text-overflow-hide element-width-block" 
                        onClick={() => {
                            if (props.editorState === undefined) {
                                props.setEditorState({
                                    rowIndex: rowIndex,
                                    columnIndex: colIndex,
                                    formula: formulaBarValue,
                                    arrowKeysScrollInFormula: true,
                                    editorLocation: 'formula bar',
                                    editingMode: columnFormulaLocation || 'entire_column',
                                    sheetIndex: props.sheetIndex,
                                })
                            // If we're opening the formula cell editor while the cell editor is currently open,
                            // then we should keep the cell editor state the same, but just change the editor location.
                            } else {
                                props.setEditorState({
                                    ...props.editorState,
                                    editorLocation: 'formula bar',
                                })
                            }
                        }}
                    >
                        {formulaBarValue}
                    </div>
                }
            </Col>
        </Row>
    )
}

export default FormulaBar
