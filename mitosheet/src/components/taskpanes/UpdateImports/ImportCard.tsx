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
        return  <p>{updatedImport.import_params.file_names[0]}</p>
    } else if (updatedImport.type === 'excel') {
        return <p>{updatedImport.import_params.sheet_names[0]} <span className='text-subtext-1'> from </span> {updatedImport.import_params.file_name}</p>
    } else {
        return <p>{updatedImport.import_params.df_names[0]}</p>
    }
}



/* 
  A custom component that displays a previous import and whether its still valid
*/
const ImportCard = (props: {
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    importIndex: number,
    updatedImports: UpdatedImport[]
}): JSX.Element => {

    const updatedImport = props.updatedImports[props.importIndex]

    return (
        <Row justify='space-between' align='center'>
            <Col span={16}>
                {getTitleText(updatedImport)}
            </Col>
            <Col span={4}>
                <div onClick={() => {
                    // We open the merge taskpane
                    props.setUIState(prevUIState => {
                        return {
                            ...prevUIState,
                            currOpenModal: {type: ModalEnum.None},
                            currOpenTaskpane: {
                                type: TaskpaneType.UPDATE_IMPORT_WITH_DATAFRAME, 
                                updatedImports: props.updatedImports, 
                                importIndex: props.importIndex
                            },
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