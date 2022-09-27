// Copyright (c) Mito

import React from 'react';
import { UIState } from '../../../types';
import RightPointerIcon from '../../icons/RightPointerIcon';
import Col from '../../layout/Col';
import Row from '../../layout/Row';
import { ModalEnum } from '../../modals/modals';
import { TaskpaneType } from '../taskpanes';
import { UpdatedImport } from './UpdateImportsTaskpane';
import CSVFileIcon from '../../icons/CSVFileIcon';

const getBaseOfPath = (fullPath: string): string => {
    return fullPath.replace(/^.*[\\\\/]/, '')
}

const getTitleText = (updatedImport: UpdatedImport): string => {
    let fullPath = ''
    if (updatedImport.type === 'csv') {
        fullPath = updatedImport.import_params.file_names[0]
    } else if (updatedImport.type === 'excel') {
        fullPath = updatedImport.import_params.sheet_names[0]
    } else {
        fullPath = updatedImport.import_params.df_names[0]
    }

    return getBaseOfPath(fullPath)
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
    console.log(updatedImport)

    return (
        <Row justify='space-between' align='center'>
            <Col span={22}>
                <Row align='center'>
                    <CSVFileIcon />
                    <Col span={22} offset={.25}>
                        {updatedImport.type === 'excel' &&
                            <div>
                                <span className='text-color-medium-gray-important'>Imported </span> {getTitleText(updatedImport)} <span className='text-color-medium-gray-important'>from </span> {getBaseOfPath(updatedImport.import_params.file_name)}
                            </div>
                        } 
                        {updatedImport.type !== 'excel' &&
                            <div>
                                <span className='text-color-medium-gray-important'>Imported </span> {getTitleText(updatedImport)}
                            </div>
                        }
                    </Col>
                </Row>
            </Col>
            <Col>
                <div onClick={() => {
                    // We open the merge taskpane
                    
                    props.setUIState(prevUIState => {
                        return {
                            ...prevUIState,
                            currOpenModal: {type: ModalEnum.None},
                            currOpenTaskpane: {
                                type: TaskpaneType.IMPORT_FILES, 
                                updateImportedData: {
                                    updatedImports: props.updatedImports, 
                                    importIndex: props.importIndex
                                }
                            },
                            selectedTabType: 'data'
                        }
                    })


                    /*
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
                    */
                }}>
                    <RightPointerIcon />
                </div>
            </Col>
            
        </Row>
    )
} 

export default ImportCard