// Copyright (c) Mito

import React from 'react';
import Dropdown from '../../elements/Dropdown';
import DropdownItem from '../../elements/DropdownItem';
import CSVFileIcon from '../../icons/CSVFileIcon';
import RightPointerIcon from '../../icons/RightPointerIcon';
import Col from '../../layout/Col';
import Row from '../../layout/Row';
import { DataframeCreationData, ReplacingDataframeState } from './UpdateImportsTaskpane';
import { getBaseOfPath, isUpdatedDfCreationData } from './UpdateImportsUtils';

export const getUpdateImportCardTitle = (dataframeCreationData: DataframeCreationData): JSX.Element => {
    if (dataframeCreationData.step_type === 'excel_import') {
        return (
            <div>
                <span className='text-color-medium-gray-important'>Imported </span> {dataframeCreationData.params.sheet_names[0]} <span className='text-color-medium-gray-important'>from </span> {getBaseOfPath(dataframeCreationData.params.file_name)}
            </div>
        )
    } else if (dataframeCreationData.step_type === 'simple_import') {
        return (
            <div>
                <span className='text-color-medium-gray-important'>Imported </span> {getBaseOfPath(dataframeCreationData.params.file_names[0])}
            </div>
        )
    } else {
        return (
            <div>
                <span className='text-color-medium-gray-important'>Imported </span> {dataframeCreationData.params.df_names[0]}
            </div>
        )
    }
}

export const getUpdateImportCardSubtitle = (dataframeCreationData: DataframeCreationData, updatedDataframeCreationData: DataframeCreationData): JSX.Element | null => {
    const isUpdated = isUpdatedDfCreationData(dataframeCreationData, updatedDataframeCreationData);

    if (!isUpdated) {
        return null;
    }

    if (updatedDataframeCreationData.step_type === 'excel_import') {
        return (
            <div>
                <span className='text-color-medium-gray-important'>Updated to </span> {updatedDataframeCreationData.params.sheet_names[0]} <span className='text-color-medium-gray-important'>from </span> {getBaseOfPath(updatedDataframeCreationData.params.file_name)}
            </div>
        )
    } else if (updatedDataframeCreationData.step_type === 'simple_import') {
        return (
            <div>
                <span className='text-color-medium-gray-important'>Updated to </span> {getBaseOfPath(updatedDataframeCreationData.params.file_names[0])}
            </div>
        )
    } else {
        return (
            <div>
                <span className='text-color-medium-gray-important'>Updated </span> {updatedDataframeCreationData.params.df_names[0]}
            </div>
        )
    }
}

/* 
  A custom component that displays a previous import and whether its still valid
*/
const UpdateImportCard = (props: {
    dataframeCreationIndex: number;
    dataframeCreationData: DataframeCreationData;
    updatedDataframeCreationData: DataframeCreationData;
    displayedImportCardDropdown: number | undefined;
    setDisplayedImportCardDropdown: React.Dispatch<React.SetStateAction<number | undefined>>;
    setReplacingDataframeState: React.Dispatch<React.SetStateAction<ReplacingDataframeState | undefined>>
}): JSX.Element => {

    const displayDropdown = props.displayedImportCardDropdown === props.dataframeCreationIndex;

    const openDropdown = () => {
        props.setDisplayedImportCardDropdown(props.dataframeCreationIndex)
    }

    const closeDropdown = () => {
        props.setDisplayedImportCardDropdown(prevValue => {
            if (prevValue !== props.dataframeCreationIndex) {
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
                        {getUpdateImportCardSubtitle(props.dataframeCreationData, props.updatedDataframeCreationData)}
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