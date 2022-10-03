// Copyright (c) Mito

import React, { useEffect } from 'react';
import MitoAPI from '../../../jupyter/api';
import { AnalysisData, UIState, UserProfile } from '../../../types';
import TextButton from '../../elements/TextButton';
import ConfigureIcon from '../../icons/ConfigureIcon';
import Col from '../../layout/Col';
import Row from '../../layout/Row';
import DefaultTaskpane from '../../taskpanes/DefaultTaskpane/DefaultTaskpane';
import DefaultTaskpaneBody from '../../taskpanes/DefaultTaskpane/DefaultTaskpaneBody';
import DefaultTaskpaneFooter from '../../taskpanes/DefaultTaskpane/DefaultTaskpaneFooter';
import DefaultTaskpaneHeader from '../../taskpanes/DefaultTaskpane/DefaultTaskpaneHeader';
import { FileElement } from '../../taskpanes/FileImport/FileImportTaskpane';
import { getElementsToDisplay, getFileEnding, getImportButtonStatus, isExcelFile } from '../../taskpanes/FileImport/importUtils';
import { ImportScreen } from '../../taskpanes/FileImport/FileImportTaskpane';
import FileBrowserBody, { FileBrowserState } from './FileBrowserBody';

interface FileBrowserProps {
    mitoAPI: MitoAPI;
    analysisData: AnalysisData;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    isUpdate: boolean;

    currPathParts: string[];
    setCurrPathParts: (newCurrPathParts: string[]) => void;

    selectedFile: FileElement | undefined;
    setSelectedFile: React.Dispatch<React.SetStateAction<FileElement | undefined>>;

    fileBrowserState: FileBrowserState;
    setFileBrowserState: React.Dispatch<React.SetStateAction<FileBrowserState>>;

    setScreen: React.Dispatch<React.SetStateAction<ImportScreen>>;
    importCSVFile: (file: FileElement) => Promise<void>;

    backCallback?: () => void;
}

// You can either select a file then change the screen
// Or, you can import a CSV directly. The latter should be a function you
// pass in called importCSVFile, that takes a file element...
// and requires error handling, or what? No.
function FileBrowser(props: FileBrowserProps): JSX.Element {

    // We make sure to get the elements that are displayed and use the index on that to get the correct element
    const selectedFile: FileElement | undefined = getElementsToDisplay(props.fileBrowserState)[props.fileBrowserState.selectedElementIndex];

    /* 
        Any time the current path changes, we update
        the files that are displayed
    */
    useEffect(() => {
        // When the current path changes, we reload the path contents
        void loadPathContents(props.currPathParts)
        // We also unselect anything that might be selected
        props.setFileBrowserState(prevImportState => {
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
        props.setFileBrowserState(prevImportState => {
            return {
                ...prevImportState,
                loadingFolder: true
            }
        })
        const _pathContents = await props.mitoAPI.getPathContents(currPathParts);
        if (_pathContents) {
            props.setFileBrowserState(prevImportState => {
                return {
                    ...prevImportState,
                    pathContents: _pathContents,
                    loadingFolder: false
                }
            })
        } else {
            props.setFileBrowserState(prevImportState => {
                return {
                    ...prevImportState,
                    loadingFolder: false
                }
            })
        }
    }

    const importButtonStatus = getImportButtonStatus(
        selectedFile, 
        props.userProfile.excelImportEnabled, 
        props.fileBrowserState.loadingImport,
        props.isUpdate
    );

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader
                header={`TODO: allow a header to be passed`}
                setUIState={props.setUIState}
                backCallback={props.backCallback}
            />
            <DefaultTaskpaneBody noScroll>
                <FileBrowserBody
                    mitoAPI={props.mitoAPI}
                    userProfile={props.userProfile}
                    setUIState={props.setUIState}

                    currPathParts={props.currPathParts}
                    setCurrPathParts={props.setCurrPathParts}

                    fileBrowserState={props.fileBrowserState}
                    setFileBrowserState={props.setFileBrowserState}

                    setSelectedFile={props.setSelectedFile}
                    setScreen={props.setScreen}
                />
            </DefaultTaskpaneBody>
            <DefaultTaskpaneFooter>
                <Row justify='space-between'>
                    {!importButtonStatus.disabled && !isExcelFile(selectedFile) &&
                        <Col>
                            <TextButton
                                variant='light'
                                width='small'
                                onClick={() => {
                                    props.setScreen('csv_import');
                                }}
                                disabled={importButtonStatus.disabled}
                            >
                                <Row suppressTopBottomMargin justify='space-between' align='center'>
                                    <ConfigureIcon/>
                                    <p className='ml-2px'>
                                        Configure
                                    </p>
                                </Row>
                                
                            </TextButton>
                        </Col>
                    }
                    <Col span={!importButtonStatus.disabled && !isExcelFile(selectedFile) ? 18 : 24}>
                        <TextButton
                            variant='dark'
                            width='block'
                            onClick={() => {
                                props.setSelectedFile(selectedFile);

                                if (isExcelFile(selectedFile)) {
                                    props.setScreen('xslx_import');
                                } else {
                                    props.importCSVFile(selectedFile);
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