// Copyright (c) Mito

import React from 'react';

// Import css
import "../../../css/FormulaBar.css";
import "../../../css/mito.css"
import { EditorState, SheetData, MitoSelection } from '../../types';
import { getFullFormula } from './cellEditorUtils';
import { getCellDataFromCellIndexes } from './utils';
import Col from '../spacing/Col';
import Row from '../spacing/Row';

const FormulaBar = (props: {
    sheetData: SheetData | undefined,
    selection: MitoSelection,
    editorState: EditorState | undefined;
}): JSX.Element => {

    const {columnHeader, columnFormula, cellValue} = getCellDataFromCellIndexes(props.sheetData, props.selection.endingRowIndex, props.selection.endingColumnIndex);
    const originalFormulaBarValue = '' + (columnFormula !== undefined && columnFormula !== '' ? columnFormula : (cellValue !== undefined ? cellValue : ''));
    const cellEditingCellData = props.editorState === undefined ? undefined : getCellDataFromCellIndexes(props.sheetData, props.editorState.rowIndex, props.editorState.columnIndex);
    const formulaBarColumnHeader = props.editorState === undefined ? columnHeader : cellEditingCellData?.columnHeader;
    const formulaBarValue = props.editorState === undefined ? originalFormulaBarValue : getFullFormula(props.editorState.formula, formulaBarColumnHeader || '', props.editorState.pendingSelectedColumns);


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
                <input className="formula-bar-formula text-header-3 text-overflow-hide element-width-block" value={formulaBarValue} disabled />
            </Col>
        </Row>
    )
}

export default FormulaBar
