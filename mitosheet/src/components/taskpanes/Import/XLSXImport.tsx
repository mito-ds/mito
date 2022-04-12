// Copyright (c) Mito

import React, { useEffect, useState } from 'react';

// Import 
import MitoAPI from '../../../api';
import Input from '../../elements/Input';
import MultiToggleBox from '../../elements/MultiToggleBox';
import MultiToggleItem from '../../elements/MultiToggleItem';
import Select from '../../elements/Select';
import TextButton from '../../elements/TextButton';
import DropdownItem from '../../elements/DropdownItem';
import { ExcelFileMetadata } from '../../../types';

// CSS
import '../../../../css/taskpanes/Import/ImportTaskpane.css'
import { ImportTaskpaneState } from './ImportTaskpane';

interface XLSXImportProps {
    mitoAPI: MitoAPI;
    pathParts: string[];
    importState: ImportTaskpaneState;
    setImportState: React.Dispatch<React.SetStateAction<ImportTaskpaneState>>
}

const getXLSXImportButtonText = (stepID: string | undefined, numSelectedSheets: number, loadingImport: boolean): string => {
    if (loadingImport) {
        return "Importing..."
    }
    return stepID === undefined 
        ? `Import ${numSelectedSheets} Selected Sheet${numSelectedSheets === 1 ? '' : 's'}` 
        : `Reimport ${numSelectedSheets} Selected Sheet${numSelectedSheets === 1 ? '' : 's'}`
}

/* 
    Allows a user to import an XLSX file with the given name, and
    in turn allows them to configure how to import sheets in this
    file.
*/
function XLSXImport(props: XLSXImportProps): JSX.Element {

    const [loading, setLoading] = useState(true);
    const [fileMetadata, setFileMetadata] = useState<ExcelFileMetadata>({sheet_names: [], size: 0});
    const [sheetToggles, setSheetToggles] = useState<boolean[]>([]);
    const [hasHeaderRow, setHasHeaderRow] = useState('Yes');
    const [skiprows, setSkiprows] = useState('0');
    const [stepID, setStepID] = useState<string | undefined>(undefined);

    const loadSheets = async () => {
        const joinedPath = await props.mitoAPI.getPathJoined(
            props.pathParts
        );
        if (joinedPath === undefined) {
            return;
        }
        const loadedFileMetadata = await props.mitoAPI.getExcelFileMetadata(
            joinedPath
        )
        setFileMetadata(loadedFileMetadata || {sheet_names: [], size: 0})

        const newSheetToggles = (loadedFileMetadata?.sheet_names || []).map(() => true);
        setSheetToggles(newSheetToggles);
        setLoading(false);
    }

    useEffect(() => {
        void loadSheets()
    }, []);

    const importXLSXFile = async () => {
        const sheetsToImport = fileMetadata.sheet_names.filter((sheetName, idx) => {
            return sheetToggles[idx]
        })
        const joinedPath = await props.mitoAPI.getPathJoined(
            props.pathParts
        );
        if (joinedPath === undefined) {
            return;
        }

        props.setImportState(prevImportState => {
            return {
                ...prevImportState,
                loadingImport: true
            }
        })
        const newStepID = await props.mitoAPI.editExcelImport(
            joinedPath,
            sheetsToImport,
            hasHeaderRow === 'Yes',
            parseInt(skiprows),
            stepID
        )
        props.setImportState(prevImportState => {
            return {
                ...prevImportState,
                loadingImport: false
            }
        })
        setStepID(newStepID);
    }

    const numSelectedSheets = sheetToggles.reduce((prevValue, currentValue) => {
        if (currentValue) {
            return prevValue + 1;
        }
        return prevValue;
    }, 0)

    const importButtonText = getXLSXImportButtonText(stepID, numSelectedSheets, props.importState.loadingImport)
    return (
        <>
            <div> 
                <MultiToggleBox
                    loading={loading}
                    searchable
                    height='medium'
                    toggleAllIndexes={(indexesToToggle, newToggleValue) => {
                        setSheetToggles(oldSheetToggles => {
                            const newSheetToggles = [...oldSheetToggles];
                            indexesToToggle.forEach(index => {
                                newSheetToggles[index] = newToggleValue;
                            })
                            return newSheetToggles;
                        })
                        // Reset to a new step if we're importing new sheets
                        setStepID(undefined);
                    }}
                >
                    {fileMetadata.sheet_names.map((sheetName, idx) => {
                        return (
                            <MultiToggleItem
                                key={idx}
                                title={sheetName}
                                toggled={sheetToggles[idx]}
                                onToggle={() => {
                                    setSheetToggles(oldSheetToggles => {
                                        const newSheetToggles = [...oldSheetToggles];
                                        newSheetToggles[idx] = !newSheetToggles[idx]
                                        return newSheetToggles;
                                    })
                                    // Reset to a new step if we're importing new sheets
                                    setStepID(undefined);
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
                    value={hasHeaderRow}
                    onChange={(newValue: string) => setHasHeaderRow(newValue)}
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
                    value={skiprows}
                    type='number'
                    onChange={(e) => {setSkiprows(e.target.value)}}
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
            <div className='import-taskpane-import-button-container'>
                <TextButton
                    variant='dark'
                    width='block'
                    onClick={importXLSXFile}
                    disabled={numSelectedSheets === 0}
                    autoFocus
                >
                    {importButtonText}
                </TextButton>
            </div>
        </>
    )
}

export default XLSXImport;