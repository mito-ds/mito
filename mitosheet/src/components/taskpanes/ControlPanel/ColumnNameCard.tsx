// Copyright (c) Mito

import React from 'react';
import MitoAPI from '../../../jupyter/api';
import { ColumnHeader, EditorState, GridState, UIState } from '../../../types';
import XIcon from '../../icons/XIcon';
import Col from '../../spacing/Col';
import Row from '../../spacing/Row';
import { TaskpaneType } from '../taskpanes';
import { getDisplayColumnHeader } from '../../../utils/columnHeaders';


type ColumnNameCardProps = {
    columnHeader: ColumnHeader,
    columnIndex: number,
    mitoContainerRef: React.RefObject<HTMLDivElement>;
    gridState: GridState,
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>;
    mitoAPI: MitoAPI
}
/*
    A modal that displays the column name and allows the user to 
    click on the header to rename the column
*/
const ColumnNameCard = (props: ColumnNameCardProps): JSX.Element => {

    return (
        <>
            <Row justify='space-between' align='center'>
                <Col span={20}>
                    <p 
                        className='text-header-2 text-overflow-hide'
                        title={getDisplayColumnHeader(props.columnHeader)}
                    >
                        {getDisplayColumnHeader(props.columnHeader)} 
                    </p>
                </Col>
                <Col offset={1}>
                    <XIcon
                        onClick={() => {
                            props.setUIState((prevUIState) => {
                                return {
                                    ...prevUIState,
                                    currOpenTaskpane: {type: TaskpaneType.NONE}
                                }
                            })
                        }}
                    />
                </Col>
            </Row>          
        </>
    )
}

export default ColumnNameCard;