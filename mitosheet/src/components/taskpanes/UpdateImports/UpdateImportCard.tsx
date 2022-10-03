// Copyright (c) Mito

import React from 'react';
import Dropdown from '../../elements/Dropdown';
import DropdownItem from '../../elements/DropdownItem';
import CSVFileIcon from '../../icons/CSVFileIcon';
import RightPointerIcon from '../../icons/RightPointerIcon';
import Col from '../../layout/Col';
import Row from '../../layout/Row';
import { DataframeCreationIndex, ReplacingDataframeState } from './UpdateImportsTaskpane';
import { getBaseOfPath } from './UpdateImportsUtils';

type DataframeCreationData = {
    'step_type': 'simple_import',
    'file_name': string
} | {
    'step_type': 'excel_import',
    'file_name': string,
    'sheet_name': string,
} | {
    'step_type': 'dataframe_import',
    'df_name': string,
}

export const getUpdateImportCardTitle = (dataframeCreationData: DataframeCreationData): JSX.Element => {
    if (dataframeCreationData.step_type === 'excel_import') {
        return (
            <div>
                <span className='text-color-medium-gray-important'>Imported </span> {dataframeCreationData.sheet_name} <span className='text-color-medium-gray-important'>from </span> {getBaseOfPath(dataframeCreationData.file_name)}
            </div>
        )
    } else if (dataframeCreationData.step_type === 'simple_import') {
        return (
            <div>
                <span className='text-color-medium-gray-important'>Imported </span> {getBaseOfPath(dataframeCreationData.file_name)}
            </div>
        )
    } else {
        return (
            <div>
                <span className='text-color-medium-gray-important'>Imported </span> {dataframeCreationData.df_name}
            </div>
        )
    }
}


/* 
  A custom component that displays a previous import and whether its still valid
*/
const UpdateImportCard = (props: {
    dataframeCreationIndex: DataframeCreationIndex;
    dataframeCreationData: DataframeCreationData;
    //updatedDataframeCreationData: DataframeCreationData;
    displayedImportCardDropdown: DataframeCreationIndex | undefined;
    setDisplayedImportCardDropdown: React.Dispatch<React.SetStateAction<DataframeCreationIndex | undefined>>;
    setReplacingDataframeState: React.Dispatch<React.SetStateAction<ReplacingDataframeState | undefined>>
}): JSX.Element => {

    const displayDropdown = props.displayedImportCardDropdown?.step_id === props.dataframeCreationIndex.step_id && props.displayedImportCardDropdown?.index === props.dataframeCreationIndex.index;

    const openDropdown = () => {
        props.setDisplayedImportCardDropdown({
            step_id: props.dataframeCreationIndex.step_id,
            index: props.dataframeCreationIndex.index
        })
    }

    const closeDropdown = () => {
        props.setDisplayedImportCardDropdown(prevValue => {
            if (prevValue?.step_id !== props.dataframeCreationIndex.step_id || prevValue?.index !== props.dataframeCreationIndex.index) {
                return prevValue;
            }
            return undefined;
        })
    }

    //const updated = !isDeepEqual(props.dataframeCreationData, props.updatedDataframeCreationData);

    return (
        <Row justify='space-between' align='center'>
            <Col span={22}>
                <Row align='center'>
                    <CSVFileIcon />
                    <Col span={22} offset={.25}>
                        {getUpdateImportCardTitle(props.dataframeCreationData)}
                    </Col>
                </Row>
            </Col>
            <Col>
                <div onClick={() => {openDropdown()}}>
                    <RightPointerIcon />
                    <Dropdown 
                        display={displayDropdown}
                        closeDropdown={() => closeDropdown()}
                        width='medium'
                    >
                        <DropdownItem
                            title='Replace with file'
                            onClick={() => {
                                props.setReplacingDataframeState({
                                    dataframeCreationIndex: props.dataframeCreationIndex,
                                    screen: 'file_browser',
                                    params: undefined
                                });
                            }}
                        />
                        <DropdownItem
                            title='Replace with dataframe'
                            onClick={() => {
                                props.setReplacingDataframeState({
                                    dataframeCreationIndex: props.dataframeCreationIndex,
                                    screen: 'dataframe_import',
                                    params: {df_names: []}
                                });
                            }}
                        />
                    </Dropdown>
                </div>
            </Col>
            
        </Row>
    )
} 

export default UpdateImportCard;