// Copyright (c) Mito

import React from 'react';
import { UIState } from '../../../types';
import RightPointerIcon from '../../icons/RightPointerIcon';
import Col from '../../layout/Col';
import Row from '../../layout/Row';
import { ModalEnum } from '../../modals/modals';
import { TaskpaneType } from '../taskpanes';
import { UpdatedImport } from './UpdateImportsTaskpane';

const getTitleText = (updatedImport: UpdatedImport): JSX.Element => {
    if (updatedImport.type === 'csv') {
        return  <p>{updatedImport.import_params.file_name}</p>
    } else if (updatedImport.type === 'excel') {
        return <p>{updatedImport.import_params.sheet_name} <span className='text-subtext-1'> from </span> {updatedImport.import_params.file_name}</p>
    } else {
        return <p>{updatedImport.df_name}</p>
    }
}

/* 
  A custom component that displays a previous import and whether its still valid
*/
const ImportCard = (props: {
    updatedImport: UpdatedImport,
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    setUpdatedImports: (newUpdatedImport: UpdatedImport) => void
}): JSX.Element => {

    return (
        <Row justify='space-between' align='center'>
            <Col span={16}>
                {getTitleText(props.updatedImport)}
            </Col>
            <Col span={4}>
                <div onClick={() => {
                    // We open the merge taskpane
                    props.setUIState(prevUIState => {
                        return {
                            ...prevUIState,
                            currOpenModal: {type: ModalEnum.None},
                            currOpenTaskpane: {type: TaskpaneType.IMPORT_FILES, origin: 'update_imports'},
                            selectedTabType: 'data'
                        }
                    })
                }}>
                    <RightPointerIcon />
                </div>
            </Col>
            
        </Row>
    )
} 

export default ImportCard