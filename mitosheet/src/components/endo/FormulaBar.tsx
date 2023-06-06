// Copyright (c) Mito

import React from 'react';

// Import css
import "../../../css/FormulaBar.css";
import "../../../css/mito.css";
import MitoAPI from '../../api/api';
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
    sheetData: SheetData,
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
    analysisData: AnalysisData
}): JSX.Element => {

    const rowIndex = props.selection.startingRowIndex
    const colIndex = props.selection.startingColumnIndex

    const {columnHeader, columnFormula, cellValue, columnFormulaLocation} = getCellDataFromCellIndexes(props.sheetData, rowIndex, colIndex);
    const originalFormulaBarValue = '' + (columnFormula !== undefined && columnFormula !== '' ? columnFormula : (cellValue !== undefined ? cellValue : ''));
    const cellEditingCellData = props.editorState === undefined ? undefined : getCellDataFromCellIndexes(props.sheetData, props.editorState.rowIndex, props.editorState.columnIndex);
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
        formulaBarValue = getFullFormula(props.editorState.formula, props.editorState.pendingSelections, props.sheetData);
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
                        sheetData={props.sheetData}
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
                    />
                } 
                {props.editorState?.editorLocation !== 'formula bar' &&
                    <div 
                        className="formula-bar-formula text-header-3 text-overflow-hide element-width-block" 
                        onClick={() => {
                            props.setEditorState({
                                rowIndex: rowIndex,
                                columnIndex: colIndex,
                                formula: formulaBarValue,
                                arrowKeysScrollInFormula: true,
                                editorLocation: 'formula bar',
                                editingMode: columnFormulaLocation || 'entire_column'
                            })
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
