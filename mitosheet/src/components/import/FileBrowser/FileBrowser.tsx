// Copyright (c) Mito

import React, { useEffect, useState } from 'react';
// Import 
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
import FileBrowserBody, { FileBrowserState } from './FileBrowserBody';
import { FileElement } from '../../taskpanes/FileImport/ImportTaskpane';
import { getElementsToDisplay, getFileEnding, getImportButtonStatus, isExcelFile } from '../../taskpanes/FileImport/importUtils';

interface FileBrowserProps {
    mitoAPI: MitoAPI;
    analysisData: AnalysisData;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    isUpdate: boolean;

    currPathParts: string[];
    setCurrPathParts: (newCurrPathParts: string[]) => void;

    selectedFile: FileElement | undefined;
    setSelectedFile: React.Dispatch<React.SetStateAction<FileElement | undefined>>
}


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
    const selectedElement: FileElement | undefined = getElementsToDisplay(fileBrowserState)[fileBrowserState.selectedElementIndex];


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
        console.log("Loading path parts", currPathParts)
        setFileBrowserState(prevImportState => {
            return {
                ...prevImportState,
                loadingFolder: true
            }
        })
        const _pathContents = await props.mitoAPI.getPathContents(currPathParts);
        console.log("path contents", _pathContents)
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
        selectedElement, 
        props.userProfile.excelImportEnabled, 
        fileBrowserState.loadingImport,
        props.isUpdate
    );

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader
                header={`TODO: allow a header to be passed`}
                setUIState={props.setUIState}
            />
            <DefaultTaskpaneBody noScroll>
                <FileBrowserBody
                    mitoAPI={props.mitoAPI}
                    userProfile={props.userProfile}
                    setUIState={props.setUIState}

                    currPathParts={props.currPathParts}
                    setCurrPathParts={props.setCurrPathParts}

                    fileBrowserState={fileBrowserState}
                    setFileBrowserState={setFileBrowserState}

                    setSelectedFile={props.setSelectedFile}
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
                                    props.setSelectedFile(selectedElement);
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
                                void props.setSelectedFile(selectedElement);
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