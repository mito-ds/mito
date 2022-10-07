// Copyright (c) Mito

import React from 'react';

import { useStateFromAPIAsync } from '../../hooks/useStateFromAPIAsync';
import MitoAPI from '../../jupyter/api';
import { AnalysisData, UIState } from '../../types';
import { toggleInArray } from '../../utils/arrays';
import DropdownItem from '../elements/DropdownItem';
import Input from '../elements/Input';
import MultiToggleBox from '../elements/MultiToggleBox';
import MultiToggleItem from '../elements/MultiToggleItem';
import RadioButtonBox from '../elements/RadioButtonBox';
import Select from '../elements/Select';
import TextButton from '../elements/TextButton';
import Spacer from '../layout/Spacer';
import DefaultTaskpane from '../taskpanes/DefaultTaskpane/DefaultTaskpane';
import DefaultTaskpaneBody from '../taskpanes/DefaultTaskpane/DefaultTaskpaneBody';
import DefaultTaskpaneFooter from '../taskpanes/DefaultTaskpane/DefaultTaskpaneFooter';
import DefaultTaskpaneHeader from '../taskpanes/DefaultTaskpane/DefaultTaskpaneHeader';


interface XLSXImportProps {
    mitoAPI: MitoAPI;
    analysisData: AnalysisData;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    isUpdate: boolean;

    fileName: string;
    filePath: string;

    params: ExcelImportParams | undefined;
    setParams: (updater: (prevParams: ExcelImportParams) => ExcelImportParams) => void;
    edit: (finalTransform?: ((params: ExcelImportParams | undefined) => ExcelImportParams | undefined) | undefined) => void;
    editApplied: boolean;
    loading: boolean;

    backCallback: () => void;
}

export interface ExcelFileMetadata {
    sheet_names: string[]
    size: number,
}

export interface ExcelImportParams {
    file_name: string,
    sheet_names: string[],
    has_headers: boolean,
    skiprows: number | string,
}

export const getDefaultParams = (filePath: string): ExcelImportParams => {
    return {
        file_name: filePath, // TODO: fix up the weird naming here
        sheet_names: [],
        has_headers: true,
        skiprows: 0,
    }
}

const getButtonMessage = (params: ExcelImportParams, loading: boolean, isUpdate: boolean): string => {
    if (loading) {
        return `Importing...`
    } else if (params.sheet_names.length === 0) {
        return `Select sheets to import them`
    } else if (isUpdate) {
        return `Update to ${params.sheet_names[0]}`
    }
    return `Import ${params.sheet_names.length} Selected Sheet${params.sheet_names.length === 1 ? '' : 's'}`;
}


function getSuccessMessage(params: ExcelImportParams): string {
    return `Imported ${params.sheet_names.length} sheet${params.sheet_names.length === 1 ? '' : 's'}.`
}


/* 
    Allows a user to import an XLSX file with the given name, and
    in turn allows them to configure how to import sheets in this
    file.
*/
function XLSXImportScreen(props: XLSXImportProps): JSX.Element {

    // Load the metadata about the Excel file from the API
    const [fileMetadata, loading] = useStateFromAPIAsync<ExcelFileMetadata, string>(
        {sheet_names: [], size: 0},
        (filePath: string) => {return props.mitoAPI.getExcelFileMetadata(filePath)},
        (loadedData) => {
            if (loadedData !== undefined) {
                props.setParams(prevParams => {
                    // If it's an update to an existing import, we just select the first sheet, as we only ever want one sheet selected
                    // but if it's a normal import, we select all the files

                    return {
                        ...prevParams,
                        sheet_names: !props.isUpdate ? loadedData.sheet_names : loadedData.sheet_names.slice(0, 1)
                    }
                })
            }
        },
        [props.filePath]
    );


    const params = props.params;
    if (params === undefined) {
        return (
            <div className='text-body-1'>
                There has been an error loading your Excel file metadata. Please try again, or contact support.
            </div>
        )
    }

    const numSelectedSheets = params.sheet_names.length;
    
    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader
                header={!props.isUpdate ? `Import ${props.fileName}` : `Update to ${props.fileName}`}
                setUIState={props.setUIState}
                backCallback={props.backCallback}
            />
            <DefaultTaskpaneBody noScroll>
                <div> 
                    {!props.isUpdate &&
                        <MultiToggleBox
                            loading={loading}
                            searchable
                            height='medium'
                            toggleAllIndexes={(indexesToToggle) => {
                                props.setParams(prevParams => {
                                    const newSheetNames = [...prevParams.sheet_names];
                                    const sheetsToToggle = indexesToToggle.map(index => fileMetadata.sheet_names[index]);
                                    sheetsToToggle.forEach(sheetName => {
                                        toggleInArray(newSheetNames, sheetName);
                                    })

                                    return {
                                        ...prevParams,
                                        sheet_names: newSheetNames
                                    }
                                })
                            }}
                        >
                            {fileMetadata.sheet_names.map((sheetName, idx) => {
                                return (
                                    <MultiToggleItem
                                        key={idx}
                                        title={sheetName}
                                        toggled={params.sheet_names.includes(sheetName)}
                                        onToggle={() => {
                                            props.setParams(prevParams => {
                                                const newSheetNames = [...prevParams.sheet_names];
                                                toggleInArray(newSheetNames, sheetName);

                                                return {
                                                    ...prevParams,
                                                    sheet_names: newSheetNames
                                                }
                                            })
                                        }}
                                        index={idx}
                                    />
                                )
                            })}
                        </MultiToggleBox>
                    }
                    {props.isUpdate &&
                        <RadioButtonBox
                            values={fileMetadata.sheet_names}
                            selectedValue={params.sheet_names[0]}
                            height='medium'
                            onChange={(value) => props.setParams(prevParams => {
                                return {
                                    ...prevParams,
                                    sheet_names: [value]
                                }
                            })}
                            loading={loading}
                        />
                    }
                    
                    <p className='text-body-1 mt-20px'>
                        Has Header Row
                    </p>
                    <Select
                        value={params.has_headers ? 'Yes' : 'No'}
                        onChange={(newValue: string) => props.setParams(prevParams => {
                            return {
                                ...prevParams,
                                has_headers: newValue === 'Yes'
                            }
                        })}
                    >
                        <DropdownItem
                            title='Yes'
                        />
                        <DropdownItem
                            title='No'
                        />
                    </Select>
                    <p className='text-body-1 mt-20px'>
                        Number of Rows to Skip
                    </p>
                    <Input
                        value={"" + params.skiprows}
                        type='number'
                        onChange={(e) => {
                            const newValue = e.target.value;

                            props.setParams(prevParams => {
                                return {
                                    ...prevParams,
                                    skiprows: newValue
                                }
                            })
                        }}
                    />
                    {/* 
                        We note that we might have to adjust these size checks, depending
                        on feedback from users going forward.
                    */}
                    {fileMetadata.size >= 100_000 && fileMetadata.size < 10_000_000 &&
                        <p className="text-body-2 mt-20px">
                            Due to Python limitations, large Excel files take minutes to import. 
                        </p>
                    }
                    {fileMetadata.size >= 10_000_000 &&
                        <p className="text-body-2 mt-20px">
                            Due to Python limitations, massive Excel files take many minutes to import. If possible, save the Excel file as a CSV before importing.
                        </p>
                    }
                    
                </div>
            </DefaultTaskpaneBody>
            <DefaultTaskpaneFooter>
                <TextButton
                    variant='dark'
                    width='block'
                    onClick={() => props.edit((params) => {
                        if (params === undefined) {
                            return undefined;
                        }

                        // Do a final parsing to make sure that the int is a valid number
                        const parsedSkipRows = parseInt("" + params.skiprows);

                        return {
                            ...params,
                            skiprows: parsedSkipRows
                        }
                    })}
                    disabled={numSelectedSheets === 0}
                    autoFocus
                >
                    {getButtonMessage(params, props.loading, props.isUpdate)}
                </TextButton>
                {props.editApplied && !props.loading &&
                    <p className='text-subtext-1'>
                        {getSuccessMessage(params)} 
                    </p>
                } 
                {!props.editApplied && 
                    <Spacer px={18}/>
                }
            </DefaultTaskpaneFooter>
        </DefaultTaskpane>
    )
}

export default XLSXImportScreen;
