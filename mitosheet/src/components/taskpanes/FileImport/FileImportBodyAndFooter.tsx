// Copyright (c) Mito

import React, { useEffect } from 'react';
// Import 
import MitoAPI from '../../../jupyter/api';
import { AnalysisData, MitoError, UIState, UserProfile } from '../../../types';
import { isMitoError } from '../../../utils/errors';
import TextButton from '../../elements/TextButton';
import ConfigureIcon from '../../icons/ConfigureIcon';
import Col from '../../layout/Col';
import Row from '../../layout/Row';
import DefaultTaskpaneBody from '../DefaultTaskpane/DefaultTaskpaneBody';
import DefaultTaskpaneFooter from '../DefaultTaskpane/DefaultTaskpaneFooter';
import { CSVImportParams, getDefaultCSVParams } from './CSVImport';
import FileBrowser from './FileBrowser';
import { FileElement, ImportTaskpaneState } from './ImportTaskpane';
import { getElementsToDisplay, getFileEnding, getImportButtonStatus, isExcelFile } from './importUtils';

interface FileImportBodyAndFooter {
    mitoAPI: MitoAPI;
    importState: ImportTaskpaneState;
    setImportState: React.Dispatch<React.SetStateAction<ImportTaskpaneState>>
    setFullFileNameForImportWizard:  React.Dispatch<React.SetStateAction<string | undefined>>;
    setImportError: React.Dispatch<React.SetStateAction<MitoError | undefined>>;
    fileForImportWizard: FileElement | undefined;
    setFileForImportWizard: React.Dispatch<React.SetStateAction<FileElement | undefined>>;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    currPathParts: string[];
    setCurrPathParts: (newCurrPathParts: string[]) => void;
    analysisData: AnalysisData;
    updateImportedData?: (newCSVImportParams: CSVImportParams) => void
}


function FileImportBodyAndFooter(props: FileImportBodyAndFooter): JSX.Element {

    useEffect(() => {
        const getFullFileNameForImportWizard = async (fileForImportWizard: string): Promise<void> => {
            const finalPath = [...props.currPathParts];
            finalPath.push(fileForImportWizard);
            const fullFileName = await props.mitoAPI.getPathJoined(finalPath);
            props.setFullFileNameForImportWizard(fullFileName);
        }
        if (props.fileForImportWizard !== undefined) {
            void getFullFileNameForImportWizard(props.fileForImportWizard.name);
        } else {
            props.setFullFileNameForImportWizard(undefined);
        }
    }, [props.fileForImportWizard])

    // We make sure to get the elements that are displayed and use the index on that to get the correct element
    const selectedElement: FileElement | undefined = getElementsToDisplay(props.importState)[props.importState.selectedElementIndex];



    /* 
        Any time the current path changes, we update
        the files that are displayed
    */
    useEffect(() => {
        // When the current path changes, we reload the path contents
        void loadPathContents(props.currPathParts)
        // We also unselect anything that might be selected
        props.setImportState(prevImportState => {
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
        
        if (selectedElement === undefined) {
            selectedElementName = 'undefined';
        } else if (selectedElement.isDirectory) {
            selectedElementName = 'directory';
        } else {
            const fileEnding = getFileEnding(selectedElement.name);
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

    }, [selectedElement])
    

    // Loads the path data from the API and sets it for the file browser
    async function loadPathContents(currPathParts: string[]) {
        props.setImportState(prevImportState => {
            return {
                ...prevImportState,
                loadingFolder: true
            }
        })
        const _pathContents = await props.mitoAPI.getPathContents(currPathParts);
        if (_pathContents) {
            props.setImportState(prevImportState => {
                return {
                    ...prevImportState,
                    pathContents: _pathContents,
                    loadingFolder: false
                }
            })
        } else {
            props.setImportState(prevImportState => {
                return {
                    ...prevImportState,
                    loadingFolder: false
                }
            })
        }
    }

    async function importElement(element: FileElement | undefined): Promise<void> {
        const importButtonStatus = getImportButtonStatus(element, props.userProfile.excelImportEnabled, props.importState.loadingImport, props.updateImportedData !== undefined);
        // Quit early if the selected thing is not importable, or if there
        // is nothing even selected
        if (importButtonStatus.disabled || element === undefined) {
            return;
        }

        if (isExcelFile(element)) {
            props.setFileForImportWizard(element);
            return;
        }

        // Do the actual import
        const finalPath = [...props.currPathParts];
        finalPath.push(element.name);
        const joinedPath = await props.mitoAPI.getPathJoined(finalPath);
        if (joinedPath === undefined) {
            return;
        }
        // And then actually import it
        props.setImportState(prevImportState => {
            return {
                ...prevImportState,
                loadingImport: true
            }
        })

        let possibleMitoError = undefined
        if (props.updateImportedData === undefined) {
            possibleMitoError = await props.mitoAPI.editSimpleImport([joinedPath])
        } else {
            const defaultCSVParams = getDefaultCSVParams(joinedPath)
            possibleMitoError = props.updateImportedData(defaultCSVParams)
        }

        if (isMitoError(possibleMitoError)) {
            // If this an error, then we open the CSV config 
            props.setImportError(possibleMitoError);
            props.setFileForImportWizard(element);
        } 


        props.setImportState(prevImportState => {
            return {
                ...prevImportState,
                loadingImport: false
            }
        })
    }

    const importButtonStatus = getImportButtonStatus(
        selectedElement, 
        props.userProfile.excelImportEnabled, 
        props.importState.loadingImport,
        props.updateImportedData !== undefined
    );
    

    return (
        <>
            <DefaultTaskpaneBody noScroll>
                <FileBrowser
                    mitoAPI={props.mitoAPI}
                    setCurrPathParts={props.setCurrPathParts}
                    setUIState={props.setUIState}
                    importState={props.importState}
                    setImportState={props.setImportState}
                    importElement={importElement}
                    userProfile={props.userProfile}
                />
            </DefaultTaskpaneBody>
            <DefaultTaskpaneFooter>
                <Row justify='space-between'>
                    {/** TODO: maybe we should make this display on XLSX, and just allow for default import as well on that! */}
                    {!importButtonStatus.disabled && !isExcelFile(selectedElement) &&
                        <Col>
                            <TextButton
                                variant='light'
                                width='small'
                                onClick={() => {
                                    props.setImportError(undefined);
                                    props.setFileForImportWizard(selectedElement);
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
                    <Col span={!importButtonStatus.disabled && !isExcelFile(selectedElement) ? 18 : 24}>
                        <TextButton
                            variant='dark'
                            width='block'
                            onClick={() => {
                                void importElement(selectedElement);
                            }}
                            disabled={importButtonStatus.disabled}
                        >
                            {importButtonStatus.buttonText}
                        </TextButton>
                    </Col>
                </Row>
            </DefaultTaskpaneFooter>
        </>            
    )
}

export default FileImportBodyAndFooter;