/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito

import React from 'react';
import { AnalysisData, UserProfile } from '../../../types';
import Dropdown from '../../elements/Dropdown';
import DropdownItem from '../../elements/DropdownItem';
import CSVFileIcon from '../../icons/CSVFileIcon';
import RightPointerIcon from '../../icons/RightPointerIcon';
import Col from '../../layout/Col';
import Row from '../../layout/Row';
import { DataframeCreationData, ReplacingDataframeState } from './UpdateImportsTaskpane';
import { getBaseOfPath } from './updateImportsUtils';
import { getDisplayNameOfPythonVariable } from '../../../utils/userDefinedFunctionUtils';

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
                <span className='text-color-medium-important'>Imported </span> {getSimpleNameSpan(dataframeCreationData.params.sheet_names[0])} <span className='text-color-medium-important'>from </span> {getFileNameSpanFromFilePath(dataframeCreationData.params.file_name)}
            </div>
        )
    } else if (dataframeCreationData.step_type === 'simple_import') {
        return (
            <div>
                <span className='text-color-medium-important'>Imported </span> {getFileNameSpanFromFilePath(dataframeCreationData.params.file_names[0])}
            </div>
        )
    } else if (dataframeCreationData.step_type === 'dataframe_import') {
        return (
            <div>
                <span className='text-color-medium-important'>Imported </span> {getSimpleNameSpan(dataframeCreationData.params.df_names[0])}
            </div>
        )
    } else if (dataframeCreationData.step_type === 'excel_range_import') {
        return (
            <div>
                <span className='text-color-medium-important'>Imported </span> {getSimpleNameSpan(dataframeCreationData.params.range_imports[0].df_name)} <span className='text-color-medium-important'>from </span> {getFileNameSpanFromFilePath(dataframeCreationData.params.file_path)}
            </div>
        )
    } else if (dataframeCreationData.step_type === 'snowflake_import') {
        return (
            <div>
                <span className='text-color-medium-important'>Imported </span> {getSimpleNameSpan(dataframeCreationData.params.table_loc_and_warehouse.table_or_view)} <span className='text-color-medium-important'>from Snowflake </span>
            </div>
        )
    } else if (dataframeCreationData.step_type === 'user_defined_import') {
        return (
            <div>
                <span className='text-color-medium-important'>Imported custom importer </span> {getSimpleNameSpan(dataframeCreationData.params?.importer)}
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
                <span className='text-color-medium-important'>Update to </span> {getSimpleNameSpan(updatedDataframeCreationData.params.sheet_names[0])} <span className='text-color-medium-important'>from </span> {getFileNameSpanFromFilePath(updatedDataframeCreationData.params.file_name)}
            </div>
        )
    } else if (updatedDataframeCreationData.step_type === 'simple_import') {
        return (
            <div className='mt-3px'>
                <span className='text-color-medium-important'>Update to </span> {getFileNameSpanFromFilePath(updatedDataframeCreationData.params.file_names[0])}
            </div>
        )
    } else if (updatedDataframeCreationData.step_type === 'dataframe_import') {
        return (
            <div className='mt-3px'>
                <span className='text-color-medium-important'>Update to </span> {getSimpleNameSpan(updatedDataframeCreationData.params.df_names[0])}
            </div>
        )
    } else if (updatedDataframeCreationData.step_type === 'excel_range_import') {
        return (
            <div className='mt-3px'>
                <span className='text-color-medium-important'>Update to </span> {getSimpleNameSpan(updatedDataframeCreationData.params.range_imports[0].df_name)} <span className='text-color-medium-important'>from </span> {getFileNameSpanFromFilePath(updatedDataframeCreationData.params.file_path)}
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
    } else if (updatedDataframeCreationData.step_type === 'user_defined_import') {
        return (
            <div className='mt-3px'>
                <span className='text-color-medium-important'>Update using </span> {getSimpleNameSpan(updatedDataframeCreationData.params?.importer)}
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

    userProfile: UserProfile;
    analysisData: AnalysisData;
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

    const getUpdateImportOptionDropdownItems = (): JSX.Element[] => {
        let dropdownItems: JSX.Element[] = []

        if (props.dataframeCreationData.step_type === 'snowflake_import') {
            dropdownItems.push(
                <DropdownItem
                    key='Connect to Snowflake'
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
        }

        dropdownItems = dropdownItems.concat([
            <DropdownItem
                key='Replace with file'
                title='Replace with file'
                onClick={() => {
                    props.setReplacingDataframeState({
                        dataframeCreationIndex: props.dataframeCreationIndex,
                        importState: {screen: 'file_browser'},
                        params: undefined
                    });
                }}
            />,
            <DropdownItem
                key='Replace with dataframe'
                title='Replace with dataframe'
                onClick={() => {
                    props.setReplacingDataframeState({
                        dataframeCreationIndex: props.dataframeCreationIndex,
                        importState: {screen: 'dataframe_import'},
                        params: {df_names: []}
                    });
                }}
            />,
            
        ])

        // Add the user defined importers
        props.analysisData.userDefinedImporters.forEach(f => {
            const displayName = getDisplayNameOfPythonVariable(f.name);
            dropdownItems.push(<DropdownItem
                key={`Replace with ${displayName}`}
                title={`Replace with ${displayName}`}
                onClick={() => {
                    props.setReplacingDataframeState({
                        dataframeCreationIndex: props.dataframeCreationIndex,
                        importState: {
                            screen: 'user_defined_import',
                            importer_name: f.name
                        },
                        params: undefined
                    });
                }}
                disabled={!props.userProfile.isEnterprise}
                subtext={!props.userProfile.isEnterprise ? 'Requires Mito Enterprise' : undefined}
            />)
        })

        return dropdownItems
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
                        width='large'
                    >
                        {getUpdateImportOptionDropdownItems()}
                    </Dropdown>
                </div>
            </Col>
            
        </Row>
    )
} 

export default UpdateImportCard;