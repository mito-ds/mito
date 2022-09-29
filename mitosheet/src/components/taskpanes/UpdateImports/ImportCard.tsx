// Copyright (c) Mito

import React from 'react';
import { UIState } from '../../../types';
import RightPointerIcon from '../../icons/RightPointerIcon';
import Col from '../../layout/Col';
import Row from '../../layout/Row';
import { ModalEnum } from '../../modals/modals';
import { TaskpaneType } from '../taskpanes';
import { UpdatedImportObj } from './UpdateImportsTaskpane';
import CSVFileIcon from '../../icons/CSVFileIcon';
import DropdownItem from '../../elements/DropdownItem';
import Dropdown from '../../elements/Dropdown';

const getBaseOfPath = (fullPath: string): string => {
    return fullPath.replace(/^.*[\\\\/]/, '')
}

export const getImportName = (updatedImportObj: UpdatedImportObj): string => {
    let fullPath = ''
    if (updatedImportObj.type === 'csv') {
        fullPath = updatedImportObj.import_params.file_names[0]
    } else if (updatedImportObj.type === 'excel') {
        fullPath = updatedImportObj.import_params.sheet_names[0]
    } else {
        fullPath = updatedImportObj.import_params.df_names[0]
    }

    return getBaseOfPath(fullPath)
}


/* 
  A custom component that displays a previous import and whether its still valid
*/
const ImportCard = (props: {
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    importIndex: number,
    updatedImportObjs: UpdatedImportObj[]
    displayedImportCardDropdownIndex: number | undefined
    setDisplayedImportCardDropdownIndex: React.Dispatch<React.SetStateAction<number | undefined>>
}): JSX.Element => {

    const updatedImportObj = props.updatedImportObjs[props.importIndex]

    return (
        <Row justify='space-between' align='center'>
            <Col span={22}>
                <Row align='center'>
                    <CSVFileIcon />
                    <Col span={22} offset={.25}>
                        {updatedImportObj.type === 'excel' &&
                            <div>
                                <span className='text-color-medium-gray-important'>Imported </span> {getImportName(updatedImportObj)} <span className='text-color-medium-gray-important'>from </span> {getBaseOfPath(updatedImportObj.import_params.file_name)}
                            </div>
                        } 
                        {updatedImportObj.type !== 'excel' &&
                            <div>
                                <span className='text-color-medium-gray-important'>Imported </span> {getImportName(updatedImportObj)}
                            </div>
                        }
                    </Col>
                </Row>
            </Col>
            <Col>
                <div onClick={() => {props.setDisplayedImportCardDropdownIndex(props.importIndex)}}>
                    <RightPointerIcon />
                    <Dropdown 
                        display={props.displayedImportCardDropdownIndex === props.importIndex}
                        closeDropdown={() => props.setDisplayedImportCardDropdownIndex(undefined)}
                        width='medium'
                    >
                        <DropdownItem
                            title='Import file'
                            onClick={() => props.setUIState(prevUIState => {
                                return {
                                    ...prevUIState,
                                    currOpenModal: {type: ModalEnum.None},
                                    currOpenTaskpane: {
                                        type: TaskpaneType.IMPORT_FILES, 
                                        updateImportedData: {
                                            updatedImportObjs: props.updatedImportObjs, 
                                            importIndex: props.importIndex
                                        }
                                    },
                                    selectedTabType: 'data'
                                }
                            })}
                        />
                        <DropdownItem
                            title='Import dataframe'
                            onClick={() => props.setUIState(prevUIState => {
                                return {
                                    ...prevUIState,
                                    currOpenModal: {type: ModalEnum.None},
                                    currOpenTaskpane: {
                                        type: TaskpaneType.DATAFRAMEIMPORT, 
                                        updateImportedData: {
                                            updatedImportObjs: props.updatedImportObjs, 
                                            importIndex: props.importIndex
                                        }
                                    },
                                    selectedTabType: 'data'
                                }
                            })}
                        />
                    </Dropdown>
                </div>
            </Col>
            
        </Row>
    )
} 

export default ImportCard