/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from "react";
import useSendEditOnClick from '../../../hooks/useSendEditOnClick';
import { MitoAPI } from "../../../api/api";
import { AnalysisData, SheetData, StepType, UIState, UserProfile } from "../../../types";
import Input from '../../elements/Input';
import Col from '../../layout/Col';
import Row from '../../layout/Row';

import MultiToggleDataframes from "../../elements/MultiToggleDataframes";
import DropdownItem from "../../elements/DropdownItem";
import Select from "../../elements/Select";
import DefaultEmptyTaskpane from "../DefaultTaskpane/DefaultEmptyTaskpane";
import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import TextButton from "../../elements/TextButton";
import DefaultTaskpaneFooter from "../DefaultTaskpane/DefaultTaskpaneFooter";
import { getInvalidFileNameError } from "../../../utils/filename";
import Toggle from "../../elements/Toggle";
import ProIcon from "../../icons/ProIcon";


interface ExportToFileTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[];
    selectedSheetIndex: number;
}

interface ExportToFileParams {
    type: 'csv' | 'excel',
    sheet_indexes: number[],
    file_name: string,
    export_formatting: boolean,
}
const getDefaultParams = (
    sheetDataArray: SheetData[], 
    sheetIndex: number,
    isPro?: boolean,
): ExportToFileParams | undefined => {

    if (sheetDataArray.length === 0 || sheetDataArray[sheetIndex] === undefined) {
        return undefined;
    }

    const sheetName = sheetDataArray[sheetIndex].dfName;

    return {
        type: "csv",
        sheet_indexes: [sheetIndex],
        file_name: `${sheetName}_export`,
        export_formatting: isPro ?? false,
    }
}

/* 
    This is the Export To File taskpane.
*/
const ExportToFileTaskpane = (props: ExportToFileTaskpaneProps): JSX.Element => {

    const {params, setParams, edit, editApplied, loading} = useSendEditOnClick<ExportToFileParams, undefined>(
        () => getDefaultParams(props.sheetDataArray, props.selectedSheetIndex, props.userProfile.isPro),
        StepType.ExportToFile, 
        props.mitoAPI,
        props.analysisData,
    )

    if (params === undefined) {
        return <DefaultEmptyTaskpane setUIState={props.setUIState} message='Please import a dataframe before attempting to export it'/>
    }

    // Warn the user if they have some ending that is invalid
    let invalidFileNameWarning: string | undefined = undefined;
    if (params.type === 'csv' && params.file_name.endsWith('.xlsx')) {
        invalidFileNameWarning = 'The .xlsx file extension does not match the CSV File Type.'
    } else if (params.type === 'excel' && (params.file_name.endsWith('.txt') || params.file_name.endsWith('.csv'))) {
        invalidFileNameWarning = 'The file extension ending does not match the Excel file type.'
    } else {
        invalidFileNameWarning = getInvalidFileNameError(params.file_name);
    }

    let exportFileDisabledMessage = undefined;
    if (!props.userProfile.isPro) {
        exportFileDisabledMessage = 'Upgrade to Mito Pro to export with formatting.'
    } else if (params.type !== 'excel') {
        exportFileDisabledMessage = 'CSV files cannot be formatted. Switch to Excel export to export formatting.'
    }

    return (
        <DefaultTaskpane setUIState={props.setUIState} mitoAPI={props.mitoAPI}>
            <DefaultTaskpaneHeader 
                header="Export To File"
                setUIState={props.setUIState}           
            />
            <DefaultTaskpaneBody>
                <Row justify='space-between' align='center' title='TODO'>
                    <Col>
                        <p className='text-header-3'>
                            File Name
                        </p>
                    </Col>
                    <Col>
                        <Input
                            autoFocus
                            placeholder="MitoExport"
                            width='medium'
                            value={'' + params.file_name}
                            onChange={(e) => {
                                const newValue = e.target.value;
                                
                                setParams(prevParams => {
                                    return {
                                        ...prevParams,
                                        file_name: newValue
                                    }
                                })
                            }}
                        />
                    </Col>
                </Row>
                {invalidFileNameWarning !== undefined && <p className="text-color-error">{invalidFileNameWarning}</p>}
                <Row justify='space-between' align='center'>
                    <Col>
                        <p className='text-header-3'>
                            File Type
                        </p>
                    </Col>
                    <Col>
                        <Select 
                            width="medium"
                            value={params.type}
                            onChange={(newType) => {
                                setParams(prevParams => {
                                    return {
                                        ...prevParams,
                                        type: newType as 'csv' | 'excel'
                                    }
                                })
                            }}
                        >
                            <DropdownItem title="CSV" id='csv' subtext="Each dataframe will be exported as a seperate CSV file. If multiple dataframes are exported, their names will be appended to the file name."/>
                            <DropdownItem title="Excel" id='excel' subtext="Each exported dataframe will be exported as a seperate sheet."/>
                        </Select>
                    </Col>
                </Row>
                <Row justify='space-between' align='center' title={exportFileDisabledMessage}>
                    <Col style={{ display: 'flex' }}>
                        <p className="text-header-3">Export with formatting</p>&nbsp;
                        {!props.userProfile.isPro && 
                            <div>
                                <ProIcon/>
                            </div>
                        }
                    </Col>
                    <Col>
                        <Toggle
                            value={params.type === 'excel' ? params.export_formatting : false}
                            disabled={!props.userProfile.isPro || params.type !== 'excel'}
                            title={exportFileDisabledMessage}
                            onChange={() => {
                                setParams(prevParams => {
                                    return {
                                        ...prevParams,
                                        export_formatting: !prevParams.export_formatting
                                    }
                                })
                            }}
                        />
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <p className="text-header-3">Dataframes to Export</p>
                    </Col>
                </Row>
                <MultiToggleDataframes
                    height="medium"
                    sheetDataArray={props.sheetDataArray}
                    selectedSheetIndexes={params.sheet_indexes}
                    setUIState={props.setUIState}
                    onChange={(newSelectedSheetIndexes) => {
                        setParams(prevParams => {
                            return {
                                ...prevParams,
                                sheet_indexes: newSelectedSheetIndexes
                            }
                        })
                    }}
                />
            </DefaultTaskpaneBody>
            <DefaultTaskpaneFooter>
                {editApplied && <p className='text-subtext-1'>Export code generated.</p>}
                <TextButton
                    variant='dark'
                    width='block'
                    onClick={() => {
                        edit();
                    }}
                    disabled={params.file_name === '' || params.sheet_indexes.length === 0 || invalidFileNameWarning !== undefined || loading}
                >
                    {loading ? 'Generating...' : 'Generate Export Code'}
                </TextButton>
            </DefaultTaskpaneFooter>
        </DefaultTaskpane>
    )
}

export default ExportToFileTaskpane;