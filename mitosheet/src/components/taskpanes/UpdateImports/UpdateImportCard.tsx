// Copyright (c) Mito

import React from 'react';
import Dropdown from '../../elements/Dropdown';
import DropdownItem from '../../elements/DropdownItem';
import CSVFileIcon from '../../icons/CSVFileIcon';
import RightPointerIcon from '../../icons/RightPointerIcon';
import Col from '../../layout/Col';
import Row from '../../layout/Row';
import { DataframeCreationData, ReplacingDataframeState } from './UpdateImportsTaskpane';
import { getBaseOfPath } from './updateImportsUtils';

const getFileNameSpanFromFilePath = (filePath: string): JSX.Element => {
    const fileName = getBaseOfPath(filePath);
    // NOTE: In any span that shows a file path, we always show the full path as the title, as that
    // the users can figure out where the file is supposed to be
    return (
        <span title={filePath}>{fileName}</span>
    )
}

const getSimpleNameSpan = (name: string | undefined | null): JSX.Element => {
    return (<span title={name || 'not definend'}>{name}</span>)
}



export const getUpdateImportCardTitle = (dataframeCreationData: DataframeCreationData): JSX.Element => {
    if (dataframeCreationData.step_type === 'excel_import') {
        return (
            <div>
                <span className='text-color-medium-gray-important'>Imported </span> {getSimpleNameSpan(dataframeCreationData.params.sheet_names[0])} <span className='text-color-medium-gray-important'>from </span> {getFileNameSpanFromFilePath(dataframeCreationData.params.file_name)}
            </div>
        )
    } else if (dataframeCreationData.step_type === 'simple_import') {
        return (
            <div>
                <span className='text-color-medium-gray-important'>Imported </span> {getFileNameSpanFromFilePath(dataframeCreationData.params.file_names[0])}
            </div>
        )
    } else if (dataframeCreationData.step_type === 'dataframe_import') {
        return (
            <div>
                <span className='text-color-medium-gray-important'>Imported </span> {getSimpleNameSpan(dataframeCreationData.params.df_names[0])}
            </div>
        )
    } else if (dataframeCreationData.step_type === 'excel_range_import') {
        return (
            <div>
                <span className='text-color-medium-gray-important'>Imported </span> {getSimpleNameSpan(dataframeCreationData.params.range_imports[0].df_name)} <span className='text-color-medium-gray-important'>from </span> {getFileNameSpanFromFilePath(dataframeCreationData.params.file_path)}
            </div>
        )
    } else if (dataframeCreationData.step_type === 'snowflake_import') {
        return (
            <div>
                <span className='text-color-medium-gray-important'>Imported </span> {getSimpleNameSpan(dataframeCreationData.params.table_loc_and_warehouse.table)} <span className='text-color-medium-gray-important'>from Snowflake </span>
            </div>
        )
    } else {
        return (
            <div>
                <></>
            </div>
        )
    }
}

export const getUpdateImportCardSubtitle = (updatedDataframeCreationData: DataframeCreationData, invalidImportMessage: string | undefined, isUpdated: boolean): JSX.Element | null => {

    if (!isUpdated) {
        if (invalidImportMessage !== undefined) {
            return (
                <div className='mt-3px'>
                    <span className='text-color-error-important text-overflow-wrap'>{invalidImportMessage}</ span>
                </div>
            )
        }
        return null;
    }


    if (updatedDataframeCreationData.step_type === 'excel_import') {
        return (
            <div className='mt-3px'>
                <span className='text-color-medium-gray-important'>Update to </span> {getSimpleNameSpan(updatedDataframeCreationData.params.sheet_names[0])} <span className='text-color-medium-gray-important'>from </span> {getFileNameSpanFromFilePath(updatedDataframeCreationData.params.file_name)}
            </div>
        )
    } else if (updatedDataframeCreationData.step_type === 'simple_import') {
        return (
            <div className='mt-3px'>
                <span className='text-color-medium-gray-important'>Update to </span> {getFileNameSpanFromFilePath(updatedDataframeCreationData.params.file_names[0])}
            </div>
        )
    } else if (updatedDataframeCreationData.step_type === 'dataframe_import') {
        return (
            <div className='mt-3px'>
                <span className='text-color-medium-gray-important'>Update to </span> {getSimpleNameSpan(updatedDataframeCreationData.params.df_names[0])}
            </div>
        )
    } else if (updatedDataframeCreationData.step_type === 'excel_range_import') {
        return (
            <div className='mt-3px'>
                <span className='text-color-medium-gray-important'>Update to </span> {getSimpleNameSpan(updatedDataframeCreationData.params.range_imports[0].df_name)} <span className='text-color-medium-gray-important'>from </span> {getFileNameSpanFromFilePath(updatedDataframeCreationData.params.file_path)}
            </div>
        )
    } else if (updatedDataframeCreationData.step_type === 'snowflake_import') {
        return (
            // If the user validates their snowlfake credentials, we just remove the error, but don't add
            // an update message since the query did not change.
            <div>
                <></>
            </div>
        )
    } else {
        return (
            <div>
                <></>
            </div>
        )
    }
    
}

/* 
  This card displays an single dataframe creation, what that dataframe creation
  has been updated to, as well as some errors if there are any.
*/
const UpdateImportCard = (props: {
    dataframeCreationIndex: number;
    dataframeCreationData: DataframeCreationData;
    updatedDataframeCreationData: DataframeCreationData;
    isUpdated: boolean;

    displayedImportCardDropdown: number | undefined;
    setDisplayedImportCardDropdown: React.Dispatch<React.SetStateAction<number | undefined>>;
    setReplacingDataframeState: React.Dispatch<React.SetStateAction<ReplacingDataframeState | undefined>>;

    preUpdateInvalidImportMessage: string | undefined;
    postUpdateInvalidImportMessage: string | undefined;
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

    const getSnowflakeDropddownItemOrEmptyElement = (): JSX.Element =>  {
        if (props.dataframeCreationData.step_type === 'snowflake_import') {
            return (
                <DropdownItem
                    title='Connect to Snowflake'
                    onClick={() => {
                        props.setReplacingDataframeState({
                            dataframeCreationIndex: props.dataframeCreationIndex,
                            importState: {screen: 'authenticate_to_snowflake'},
                            params: undefined
                        });
                    }}
                />
            )
        } else {
           return (<></>)
        }
    }

    return (
        <Row justify='space-between' align='top' onClick={() => {openDropdown()}}>
            <Col span={22}>
                <Row align='top'>
                    <div className='mt-1px'>
                        <CSVFileIcon />
                    </div>
                    <Col span={22} offset={.25}>
                        {getUpdateImportCardTitle(props.dataframeCreationData)}
                        {getUpdateImportCardSubtitle(props.updatedDataframeCreationData, props.preUpdateInvalidImportMessage, props.isUpdated)}
                    </Col>
                </Row>
                {props.postUpdateInvalidImportMessage &&
                    <Row align='top'>
                        <Col span={22} offset={1.2}>
                            <span className='text-color-error-important text-overflow-wrap'>{props.postUpdateInvalidImportMessage}</ span>
                        </Col>
                    </Row>                
                }
            </Col>
            <Col className='mt-3px'>
                <div>
                    <RightPointerIcon />
                    <Dropdown 
                        display={displayDropdown}
                        closeDropdown={() => closeDropdown()}
                        width='medium'
                    >
                        {getSnowflakeDropddownItemOrEmptyElement()}
                        <DropdownItem
                            title='Replace with file'
                            onClick={() => {
                                props.setReplacingDataframeState({
                                    dataframeCreationIndex: props.dataframeCreationIndex,
                                    importState: {screen: 'file_browser'},
                                    params: undefined
                                });
                            }}
                        />
                        <DropdownItem
                            title='Replace with dataframe'
                            onClick={() => {
                                props.setReplacingDataframeState({
                                    dataframeCreationIndex: props.dataframeCreationIndex,
                                    importState: {screen: 'dataframe_import'},
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