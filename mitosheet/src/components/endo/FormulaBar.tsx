// Copyright (c) Mito

import React from 'react';

// Import css
import "../../../css/FormulaBar.css";
import "../../../css/mito.css"
import { EditorState, SheetData, MitoSelection, GridState } from '../../types';
import { getFullFormula } from './celleditor/cellEditorUtils';
import { getCellDataFromCellIndexes } from './utils';
import Col from '../spacing/Col';
import Row from '../spacing/Row';
import MitoAPI from '../../jupyter/api';
import { calculateCurrentSheetView } from './sheetViewUtils';
import CellEditor from './celleditor/CellEditor';

const FormulaBar = (props: {
    sheetData: SheetData,
    sheetIndex: number,
    gridState: GridState,
    editorState: EditorState | undefined,
    setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>,
    setGridState: React.Dispatch<React.SetStateAction<GridState>>,
    scrollAndRenderedContainerRef: React.RefObject<HTMLDivElement>,
    containerRef: React.RefObject<HTMLDivElement>,
    mitoAPI: MitoAPI,
    selection: MitoSelection,
}): JSX.Element => {

    const {columnHeader, columnFormula, cellValue} = getCellDataFromCellIndexes(props.sheetData, props.selection.endingRowIndex, props.selection.endingColumnIndex);
    const originalFormulaBarValue = '' + (columnFormula !== undefined && columnFormula !== '' ? columnFormula : (cellValue !== undefined ? cellValue : ''));
    const cellEditingCellData = props.editorState === undefined ? undefined : getCellDataFromCellIndexes(props.sheetData, props.editorState.rowIndex, props.editorState.columnIndex);
    const formulaBarColumnHeader = props.editorState === undefined ? columnHeader : cellEditingCellData?.columnHeader;
    const formulaBarValue = props.editorState === undefined ? originalFormulaBarValue : getFullFormula(props.editorState.formula, formulaBarColumnHeader || '', props.editorState.pendingSelectedColumns);
    const currentSheetView = calculateCurrentSheetView(props.gridState);

    return(
        <Row 
            align='center'
            // Add a border to the top and bottom of the formula bar
            style={{
                borderTop: '1px solid var(--mito-border)',
                borderBottom: '1px solid var(--mito-border)',
                background: 'white'
            }}
            suppressTopBottomMargin
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
                        scrollAndRenderedContainerRef={props.scrollAndRenderedContainerRef}
                        containerRef={props.containerRef}
                        mitoAPI={props.mitoAPI}
                        currentSheetView={currentSheetView}
                    />
                } 
                {(props.editorState === undefined || props.editorState.editorLocation === 'cell') &&
                    <div 
                        className="formula-bar-formula text-header-3 text-overflow-hide element-width-block" 
                        onDoubleClick={() => {
                            props.setEditorState({
                                rowIndex: props.selection.endingRowIndex,
                                columnIndex: props.selection.endingColumnIndex,
                                formula: formulaBarValue,
                                arrowKeysScrollInFormula: true,
                                editorLocation: 'formula bar'
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
