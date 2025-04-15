/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito
// Distributed under the terms of the Modified BSD License.

import React, { useState } from 'react';
import DefaultTaskpane from '../DefaultTaskpane/DefaultTaskpane';
import { MitoAPI } from '../../../api/api';

// Import 
import TextButton from '../../elements/TextButton';
import { ColumnID, ExcelExportState, SheetData, UIState, UserProfile } from '../../../types';
import Row from '../../layout/Row';
import Input from '../../elements/Input';
import Select from '../../elements/Select';
import DropdownItem from '../../elements/DropdownItem';
import { useDebouncedEffect } from '../../../hooks/useDebouncedEffect';
import LoadingDots from '../../elements/LoadingDots';
import ExcelDownloadConfigSection from './ExcelDownloadConfigSection';
import CSVDownloadConfigSection from './CSVDownloadConfigSection';
import DefaultTaskpaneHeader from '../DefaultTaskpane/DefaultTaskpaneHeader';
import DefaultTaskpaneBody from '../DefaultTaskpane/DefaultTaskpaneBody';
import DefaultEmptyTaskpane from '../DefaultTaskpane/DefaultEmptyTaskpane';
import DefaultTaskpaneFooter from '../DefaultTaskpane/DefaultTaskpaneFooter';
import { getInvalidFileNameError } from '../../../utils/filename';
import Col from '../../layout/Col';
import Toggle from '../../elements/Toggle';
import ProIcon from '../../icons/ProIcon';
import LoadingCounter from '../../elements/LoadingCounter';

interface DownloadTaskpaneProps {
    uiState: UIState
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    mitoAPI: MitoAPI,
    selectedSheetIndex: number,
    sheetDataArray: SheetData[],
    dfNames: string[];
    userProfile: UserProfile;
}

/*
    A taskpane that allows a user to download their current sheet.

    It does this by:
    1. Getting a string representation of the sheet through the api
    2. Encoding that as a file
    3. Allowing the user to download that file

    To see more about this process, read documentation here: 
    https://blog.logrocket.com/programmatic-file-downloads-in-the-browser-9a5186298d5c/
*/
const DownloadTaskpane = (props: DownloadTaskpaneProps): JSX.Element => {

    /* 
        Store the columnIDs that the user has adding formatting to through the export taskpane so when 
        the user adds a new column to be formatted, it appears at the top of the list of formatted 
        columns, no matter the column's position in the sheet. Making it easier to find 
        the column in the list.
    */    
    const [newlyFormattedColumns, setNewlyFormattedColumns] = useState<Record<number, ColumnID[]>>(() => {
        const newlyFormattedColumnsInitial: Record<number, ColumnID[]> = {}
        props.sheetDataArray.forEach((_, idx) => {
            newlyFormattedColumnsInitial[idx] = []
        })
        return newlyFormattedColumnsInitial;
    })
    
    // The string that stores the file that actually should be downloaded
    const [exportHRef, setExportHref] = useState<string>('');
    
    const [exportFormatting, setExportFormatting] = useState<boolean>(props.userProfile.isPro);
    
    const emptySheet = props.sheetDataArray.length === 0;
    const numRows = props.sheetDataArray[props.selectedSheetIndex]?.numRows;
    
    const loadExport = async () => {
        // Don't try and load data if the sheet is empty
        if (emptySheet) {
            return;
        }

        if (props.uiState.exportConfiguration.exportType === 'csv') {
            const response = await props.mitoAPI.getDataframeAsCSV(props.selectedSheetIndex);
            const csvString = 'error' in response ? '' : response.result;
            setExportHref(URL.createObjectURL(new Blob(
                [ csvString ],
                { type: 'text/csv' }
            )));
        } else if (props.uiState.exportConfiguration.exportType === 'excel') {
            const response = await props.mitoAPI.getDataframesAsExcel((props.uiState.exportConfiguration as ExcelExportState).sheetIndexes, exportFormatting);
            const excelString = 'error' in response ? '' : response.result;
            try {
                const arr = [ Uint8Array.from(window.atob(excelString), c => c.charCodeAt(0)) ];
                setExportHref(URL.createObjectURL(new Blob(
                    /* 
                        First, we convert the export string out of base 64 encoding, 
                        and the convert it back into bytes
                    */
                    arr,
                    { type: 'text/csv' } // TODO: for some reason, text/csv works fine here
                )));
            } catch (e) {
                console.error(e);
            }
        }
    }

    // Async load in the data from the mitoAPI
    useDebouncedEffect(() => {
        setExportHref('');
        void loadExport();
    }, [props.uiState.exportConfiguration, props.selectedSheetIndex, props.sheetDataArray, exportFormatting], 500)

    const onDownload = () => {
        if (invalidFileNameWarning) {
            return;
        }
        void props.mitoAPI.log(
            'button_download_log_event',
            {
                sheet_index: props.selectedSheetIndex,
                export_type: props.uiState.exportConfiguration.exportType
            }
        )
    }

    if (emptySheet) {
        return <DefaultEmptyTaskpane setUIState={props.setUIState}/>
    }

    let exportName = '';
    let fileName = props.uiState.exportConfiguration.fileName;
    if (!fileName || fileName === '') {
        fileName = 'MitoExport';
    }
    if (props.uiState.exportConfiguration.exportType === 'csv') {
        exportName = `${fileName}.csv`;
    } else if (props.uiState.exportConfiguration.exportType === 'excel') {
        exportName = `${fileName}.xlsx`;
    }

    // Warn the user if they have some character that is invalid
    const invalidFileNameWarning = getInvalidFileNameError(fileName);

    return (
        <DefaultTaskpane setUIState={props.setUIState} mitoAPI={props.mitoAPI}>
            <DefaultTaskpaneHeader
                header='Download'
                setUIState={props.setUIState}   
            />
            <DefaultTaskpaneBody>
                <div>
                    <Row justify='space-between' align='center'>
                        <p className='text-header-3'>
                            File Name
                        </p>
                        <Input
                            width='medium'
                            value={props.uiState.exportConfiguration.fileName ?? ''}
                            onChange={event => {
                                props.setUIState((prevUiState => {
                                    return {
                                        ...prevUiState,
                                        exportConfiguration: {
                                            ...prevUiState.exportConfiguration,
                                            fileName: event.target.value
                                        }
                                    }
                                }));
                            }}
                            placeholder='MitoExport'
                        />
                    </Row>
                    { invalidFileNameWarning !== undefined && <Row justify='end' align='end'> <p className="text-color-error">{invalidFileNameWarning}</p> </Row> }
                    <Row justify='space-between' align='center'>
                        <p className='text-header-3'>
                            File Type
                        </p>
                        <Select
                            width='medium'
                            value={props.uiState.exportConfiguration.exportType}
                            onChange={(newExportType: string) => {
                                setExportHref('');

                                props.setUIState(prevUIState => {
                                    if (newExportType === 'csv') {
                                        return {
                                            ...prevUIState,
                                            exportConfiguration: {
                                                exportType: 'csv',
                                                fileName: prevUIState.exportConfiguration.fileName,
                                            }
                                        }
                                    } else {
                                        return {
                                            ...prevUIState,
                                            exportConfiguration: {
                                                exportType: 'excel', 
                                                fileName: prevUIState.exportConfiguration.fileName,
                                                sheetIndexes: [props.selectedSheetIndex]
                                            }
                                        }
                                    }
                                })
                            }}
                        >
                            <DropdownItem 
                                title='csv'
                                subtext={"Exporting as a csv will not preserve any formatting."}
                            />
                            <DropdownItem 
                                title='excel'
                                subtext={
                                    numRows > 1_048_576 
                                        ? `An Excel file holds at most 1,048,576 rows, but there are ${numRows} rows in this dataframe. We'll export the first 1,048,576 rows, but this may take several minutes.`
                                        : `Due to Python limitations, Excel export can be slower than CSV export.`
                                }
                            />
                        </Select>
                    </Row>
                    {props.uiState.exportConfiguration.exportType === 'excel' && 
                        <div>
                            <Row justify='space-between' align='center'>
                                <Col>
                                    <Row>
                                        <p className="text-header-3">Export with formatting</p>&nbsp;
                                        {!props.userProfile.isPro && <ProIcon/>}
                                    </Row>
                                    <Row>
                                        <p className='text-subtext-1'>Exporting with formatting may take several minutes</p>
                                    </Row>
                                </Col>
                                <Col>
                                    <Toggle
                                        value={exportFormatting}
                                        disabled={!props.userProfile.isPro}
                                        onChange={() => {
                                            setExportFormatting(!exportFormatting)
                                        }}
                                    />
                                </Col>
                            </Row>
                            <ExcelDownloadConfigSection 
                                dfNames={props.dfNames}
                                mitoAPI={props.mitoAPI}
                                userProfile={props.userProfile}
                                sheetDataArray={props.sheetDataArray}
                                exportState={props.uiState.exportConfiguration as ExcelExportState}
                                setUIState={props.setUIState}
                                newlyFormattedColumns={newlyFormattedColumns}
                                setNewlyFormattedColumns={setNewlyFormattedColumns}
                            /> 
                        </div> 
                    }
                    {props.uiState.exportConfiguration.exportType === 'csv' && 
                        <CSVDownloadConfigSection 
                            sheetDataArray={props.sheetDataArray}
                            mitoAPI={props.mitoAPI}
                            selectedSheetIndex={props.selectedSheetIndex}
                            setUIState={props.setUIState}
                        /> 
                    }
                </div>
                
            </DefaultTaskpaneBody>
            <DefaultTaskpaneFooter>
                {/* 
                    We don't let the user click the Download button if the dataframeCSV did not return any data. 
                    This is the fix for a bug where the user was able to click download before the dataframeCSV 
                    data was populated by the API call, resulting in an empty csv file. 

                    Given the dataframe as a string, this encodes this string as a Blob (which
                    is pretty much a file), then creates a ObjectURL for that Blob. I don't know 
                    why or how, but this makes it so clicking on this downloads the dataframe.

                    For more information, see the blog post linked at the top of this file.
                */}
                {exportHRef === '' && <>Preparing file. This may take several minutes <LoadingCounter/></> }
                <TextButton
                    variant='dark'
                    width='block'
                    disabled={!!invalidFileNameWarning || exportHRef === '' }
                    href={exportHRef}
                    download={exportName}
                    onClick={onDownload}
                >
                    {exportHRef === '' ? (<>Preparing file <LoadingDots /></>) : `Download ${props.uiState.exportConfiguration.exportType === 'csv' ? 'CSV file': 'Excel workbook'}`}
                </TextButton>
            </DefaultTaskpaneFooter>
        </DefaultTaskpane>
    )
};

export default DownloadTaskpane;