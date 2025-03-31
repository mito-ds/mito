/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */


import React, { useEffect, useState } from 'react';
import { MitoAPI } from '../../../api/api';
import { AnalysisData, UIState, UserProfile } from '../../../types';
import TextButton from '../../elements/TextButton';
import ConfigureIcon from '../../icons/ConfigureIcon';
import Col from '../../layout/Col';
import Row from '../../layout/Row';
import DefaultTaskpane from '../../taskpanes/DefaultTaskpane/DefaultTaskpane';
import DefaultTaskpaneBody from '../../taskpanes/DefaultTaskpane/DefaultTaskpaneBody';
import DefaultTaskpaneFooter from '../../taskpanes/DefaultTaskpane/DefaultTaskpaneFooter';
import DefaultTaskpaneHeader from '../../taskpanes/DefaultTaskpane/DefaultTaskpaneHeader';
import { FileElement, ImportState } from '../../taskpanes/FileImport/FileImportTaskpane';
import { getElementsToDisplay, getFileEnding, getFilePath, getImportButtonStatus, isExcelFile } from '../../taskpanes/FileImport/importUtils';
import FileBrowserBody, { FileBrowserState } from './FileBrowserBody';

interface FileBrowserProps {
    mitoAPI: MitoAPI;
    analysisData: AnalysisData;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    isUpdate: boolean;

    currPathParts: string[];
    setCurrPathParts: (newCurrPathParts: string[]) => void;

    setImportState: (newImportState: ImportState) => void;
    importCSVFile: (file: FileElement) => Promise<void>;

    backCallback?: () => void;
    notCloseable?: boolean;
}

/**
 * Allows a user to browser files on their hard drive, and either 
 * select a CSV file to import directly, or enter the CSVConfig or
 * XLSXConfig screens.
 */
function FileBrowser(props: FileBrowserProps): JSX.Element {

    const [fileBrowserState, setFileBrowserState] = useState<FileBrowserState>({
        pathContents: {
            path_parts: props.currPathParts,
            elements: []
        },
        sort: 'last_modified_descending',
        searchString: '',
        selectedElementIndex: -1,
        loadingFolder: false,
        loadingImport: false
    })

    // We make sure to get the elements that are displayed and use the index on that to get the correct element
    const selectedFile: FileElement | undefined = getElementsToDisplay(fileBrowserState, props.analysisData)[fileBrowserState.selectedElementIndex];

    /* 
        Any time the current path changes, we update
        the files that are displayed
    */
    useEffect(() => {
        // When the current path changes, we reload the path contents
        void loadPathContents(props.currPathParts)
        // We also unselect anything that might be selected
        setFileBrowserState(prevImportState => {
            return {
                ...prevImportState,
                selectedElementIndex: -1
            }
        })
        // Log how long the path is
        void props.mitoAPI.log('curr_path_changed', {'path_parts_length': props.currPathParts.length})
    }, [props.currPathParts])



    /* 
        Any time the selected element changes we log the file
        ending (or none, if it has none).
    */
    useEffect(() => {
        let selectedElementName = '';
        
        if (selectedFile === undefined) {
            selectedElementName = 'undefined';
        } else if (selectedFile.isDirectory) {
            selectedElementName = 'directory';
        } else {
            const fileEnding = getFileEnding(selectedFile.name);
            if (fileEnding !== undefined) {
                selectedElementName = fileEnding;
            } else {
                selectedElementName = 'No File Ending';
            }
        }
        void props.mitoAPI.log(
            'selected_element_changed',
            {'selected_element': selectedElementName}
        )

    }, [selectedFile])
    

    // Loads the path data from the API and sets it for the file browser
    async function loadPathContents(currPathParts: string[]) {
        setFileBrowserState(prevImportState => {
            return {
                ...prevImportState,
                loadingFolder: true
            }
        })
        const response = await props.mitoAPI.getPathContents(currPathParts, props.analysisData.importFolderData?.path);
        const _pathContents = 'error' in response ? undefined : response.result;
        if (_pathContents) {
            setFileBrowserState(prevImportState => {
                return {
                    ...prevImportState,
                    pathContents: _pathContents,
                    loadingFolder: false
                }
            })
        } else {
            setFileBrowserState(prevImportState => {
                return {
                    ...prevImportState,
                    loadingFolder: false
                }
            })
        }
    }

    const importButtonStatus = getImportButtonStatus(
        selectedFile, 
        props.userProfile,
        fileBrowserState.loadingImport,
        props.isUpdate
    );

    return (
        <DefaultTaskpane setUIState={props.setUIState} mitoAPI={props.mitoAPI}>
            <DefaultTaskpaneHeader
                header={!props.isUpdate ? 'Import Files' : 'Update Import'}
                setUIState={props.setUIState}
                backCallback={props.backCallback}
                notCloseable={props.notCloseable}
            />
            <DefaultTaskpaneBody noScroll>
                <FileBrowserBody
                    mitoAPI={props.mitoAPI}
                    userProfile={props.userProfile}
                    analysisData={props.analysisData}
                    setUIState={props.setUIState}

                    currPathParts={props.currPathParts}
                    setCurrPathParts={props.setCurrPathParts}

                    fileBrowserState={fileBrowserState}
                    setFileBrowserState={setFileBrowserState}

                    importCSVFile={props.importCSVFile}
                    setImportState={props.setImportState}
                />
            </DefaultTaskpaneBody>
            <DefaultTaskpaneFooter>
                <Row justify='space-between'>
                    {!importButtonStatus.disabled && !isExcelFile(selectedFile) &&
                        <Col style={{ overflow: 'unset', marginRight: '3px', display: 'flex' }}>
                            <TextButton
                                variant='light'
                                width='hug-contents'
                                style={{ display: 'flex', alignItems: 'center', flexDirection: 'row', width: 'max-content' }}
                                onClick={() => {
                                    const openCSVImport = async () => {
                                        const filePath = await getFilePath(props.mitoAPI, props.currPathParts, selectedFile);
                                        if (filePath === undefined || selectedFile === undefined) {
                                            return;
                                        }
                                        props.setImportState({
                                            screen: 'csv_import_config',
                                            fileName: selectedFile.name,
                                            filePath: filePath
                                        });
                                    }
            
                                    void openCSVImport();
                                }}
                                disabled={importButtonStatus.disabled}
                            >
                                <ConfigureIcon/>
                                <p className='ml-2px'>
                                    Configure
                                </p>
                            </TextButton>
                        </Col>
                    }
                    <Col style={{ width: '100%' }}>
                        <TextButton
                            variant='dark'
                            width='block'
                            onClick={() => {
                                if (isExcelFile(selectedFile)) {
                                    const openExcelImport = async () => {
                                        const filePath = await getFilePath(props.mitoAPI, props.currPathParts, selectedFile);
                                        if (filePath === undefined || selectedFile === undefined) {
                                            return;
                                        }
                                        props.setImportState({
                                            screen: 'xlsx_import_config',
                                            fileName: selectedFile.name,
                                            filePath: filePath
                                        });
                                    }
            
                                    void openExcelImport();
                                } else {
                                    void props.importCSVFile(selectedFile);
                                }
                            }}
                            disabled={importButtonStatus.disabled}
                        >
                            {importButtonStatus.buttonText}
                        </TextButton>
                    </Col>
                </Row>
            </DefaultTaskpaneFooter>
        </DefaultTaskpane>            
    )
}

export default FileBrowser;