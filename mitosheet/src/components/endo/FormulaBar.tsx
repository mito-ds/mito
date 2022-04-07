// Copyright (c) Mito

import React, { useRef } from 'react';

// Import css
import "../../../css/FormulaBar.css";
import "../../../css/mito.css"
import { EditorState, SheetData, MitoSelection, GridState } from '../../types';
import { getFullFormula } from './cellEditorUtils';
import { getCellDataFromCellIndexes } from './utils';
import Col from '../spacing/Col';
import Row from '../spacing/Row';
import CellEditor from './CellEditor';
import MitoAPI from '../../api';
import { getIsHeader } from './selectionUtils';

const FormulaBar = (props: {
    sheetData: SheetData, // TODO: Make this potentially udnefiend
    selection: MitoSelection,
    editorState: EditorState | undefined;
    sheetIndex: number,
    gridState: GridState,
    setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>,
    setGridState: React.Dispatch<React.SetStateAction<GridState>>,
    mitoAPI: MitoAPI,
}): JSX.Element => {
    const rowIndex = props.selection.endingRowIndex
    const columnIndex = props.selection.endingColumnIndex

    const {columnHeader, columnFormula, cellValue} = getCellDataFromCellIndexes(props.sheetData, rowIndex, columnIndex);
    const originalFormulaBarValue = '' + (columnFormula !== undefined && columnFormula !== '' ? columnFormula : (cellValue !== undefined ? cellValue : ''));
    const cellEditingCellData = props.editorState === undefined ? undefined : getCellDataFromCellIndexes(props.sheetData, props.editorState.rowIndex, props.editorState.columnIndex);
    const formulaBarColumnHeader = props.editorState === undefined ? columnHeader : cellEditingCellData?.columnHeader;
    const formulaBarValue = props.editorState === undefined ? originalFormulaBarValue : getFullFormula(props.editorState.formula, formulaBarColumnHeader || '', props.editorState.pendingSelectedColumns);

    // The formula bar ref
    const containerRef = useRef<HTMLDivElement>(null);

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
            <Col offset={.25}>
                <p className="formula-bar-column-header text-header-3 text-overflow-hide">
                    {formulaBarColumnHeader}
                </p>
            </Col>
            {(props.editorState === undefined || props.editorState.editorLocation !== 'formula bar') &&
                <>
                    <Col>
                        <div className="formula-bar-vertical-line"/>
                    </Col>
                    <Col flex='1'>
                        <p 
                            className="formula-bar-formula text-header-3 text-overflow-hide element-width-block" 
                            onDoubleClick={() => {
                                // Don't open for headers
                                if ((rowIndex === undefined || columnIndex === undefined) || getIsHeader(rowIndex, columnIndex)) {
                                    return;
                                }

                                props.setEditorState({
                                    rowIndex: rowIndex,
                                    columnIndex: columnIndex,
                                    formula: formulaBarValue,
                                    // As in google sheets, if the starting formula is non empty, we default to the 
                                    // arrow keys scrolling in the editor
                                    arrowKeysScrollInFormula: false,
                                    editorLocation: 'formula bar'
                                })
                            }}
                        >
                            {formulaBarValue} 
                        </p>
                    </Col>
                </>
            }
            {props.editorState !== undefined && props.editorState.editorLocation === 'formula bar' &&
                <Col flex='1' ref={containerRef}>
                    <div>
                        cell Editor
                    </div>
                    <CellEditor 
                        sheetData={props.sheetData}
                        sheetIndex={props.sheetIndex}
                        gridState={props.gridState}
                        editorState={props.editorState}
                        setGridState={props.setGridState}
                        setEditorState={props.setEditorState}
                        scrollAndRenderedContainerRef={containerRef}
                        containerRef={containerRef}
                        mitoAPI={props.mitoAPI}
                    />
                </Col>
            }
        </Row>
    )
}

export default FormulaBar
