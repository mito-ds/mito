// Copyright (c) Mito

import React, { useEffect, useState } from 'react';

// Import 
import MitoAPI from '../../../jupyter/api';
import Input from '../../elements/Input';
import MultiToggleBox from '../../elements/MultiToggleBox';
import MultiToggleItem from '../../elements/MultiToggleItem';
import Select from '../../elements/Select';
import TextButton from '../../elements/TextButton';
import DropdownItem from '../../elements/DropdownItem';
import { AnalysisData, StepType, UIState } from '../../../types';
import { ImportTaskpaneState } from './ImportTaskpane';
import useSendEditOnClick from '../../../hooks/useSendEditOnClick';
import { toggleInArray } from '../../../utils/arrays';
import DefaultTaskpane from '../DefaultTaskpane/DefaultTaskpane';
import DefaultTaskpaneHeader from '../DefaultTaskpane/DefaultTaskpaneHeader';
import DefaultTaskpaneBody from '../DefaultTaskpane/DefaultTaskpaneBody';
import DefaultTaskpaneFooter from '../DefaultTaskpane/DefaultTaskpaneFooter';
import Spacer from '../../spacing/Spacer';


interface XLSXImportProps {
    mitoAPI: MitoAPI;
    analysisData: AnalysisData;
    fileName: string;
    importState: ImportTaskpaneState;
    setImportState: React.Dispatch<React.SetStateAction<ImportTaskpaneState>>;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    fileForImportWizard: string | undefined,
    setFileForImportWizard: React.Dispatch<React.SetStateAction<string | undefined>>;
}

export interface ExcelFileMetadata {
    sheet_names: string[]
    size: number,
    loading: boolean,
}

interface ExcelImportParams {
    file_name: string,
    sheet_names: string[],
    has_headers: boolean,
    skiprows: number | string,
}

const getDefaultParams = (fileName: string): ExcelImportParams => {
    return {
        file_name: fileName,
        sheet_names: [],
        has_headers: true,
        skiprows: 0,
    }
}

const getButtonMessage = (params: ExcelImportParams, loading: boolean): string => {
    if (loading) {
        return `Importing...`
    } else if (params.sheet_names.length === 0) {
        return `Select sheets to import them`
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
function XLSXImport(props: XLSXImportProps): JSX.Element {

    // NOTE: this loading state is just for getting the metadata about the sheets
    // and not for importing the file
    const [fileMetadata, setFileMetadata] = useState<ExcelFileMetadata>({sheet_names: [], size: 0, loading: true});
    const {params, setParams, loading, edit, editApplied} = useSendEditOnClick(
        () => getDefaultParams(props.fileName),
        StepType.ExcelImport,
        props.mitoAPI, props.analysisData,
        {allowSameParamsToReapplyTwice: true}
    )


    useEffect(() => {
        const loadSheets = async () => {
            const loadedFileMetadata = await props.mitoAPI.getExcelFileMetadata(props.fileName) || {sheet_names: [], size: 0, loading: false};

            setFileMetadata(loadedFileMetadata);

            setParams(prevParams => {
                return {
                    ...prevParams,
                    sheet_names: loadedFileMetadata.sheet_names
                }
            })
        }

        void loadSheets()
    }, []);

    if (params === undefined) {
        return (
            <div className='text-body-1'>
                There has been an error loading your Excel file metadata. Please try again, or contact support.
            </div>
        )
    }

    const numSelectedSheets = params?.sheet_names.length;
    
    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader
                header={`Import ${props.fileForImportWizard}`}
                setUIState={props.setUIState}
                backCallback={() => props.setFileForImportWizard(undefined)}
            />
            <DefaultTaskpaneBody noScroll>
                <div> 
                    <MultiToggleBox
                        loading={fileMetadata.loading}
                        searchable
                        height='medium'
                        toggleAllIndexes={(indexesToToggle) => {
                            setParams(prevParams => {
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
                                        setParams(prevParams => {
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
                    <p className='text-body-1 mt-20px'>
                        Has Header Row
                    </p>
                    <Select
                        value={params.has_headers ? 'Yes' : 'No'}
                        onChange={(newValue: string) => setParams(prevParams => {
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

                            setParams(prevParams => {
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
                    onClick={() => edit((params) => {
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
                    {getButtonMessage(params, loading)}
                </TextButton>
                {editApplied && !loading &&
                    <p>
                        {getSuccessMessage(params)} 
                    </p>
                } 
                {!editApplied && 
                    <Spacer px={18}/>
                }
            </DefaultTaskpaneFooter>
        </DefaultTaskpane>
    )
}

export default XLSXImport;
