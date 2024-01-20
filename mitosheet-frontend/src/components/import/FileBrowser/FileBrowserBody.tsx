// Copyright (c) Mito
import React, { useEffect, useRef } from 'react';
import '../../../../css/elements/Input.css';
import '../../../../css/taskpanes/Import/FileBrowser.css';
import { MitoAPI } from '../../../api/api';
import { AnalysisData, UIState, UserProfile } from '../../../types';
import { classNames } from '../../../utils/classNames';
import { isInDashboard, isInStreamlit } from '../../../utils/location';
import { isExcelImportEnabled } from '../../../utils/packageVersion';
import SortArrowIcon from '../../icons/SortArrowIcon';
import Col from '../../layout/Col';
import Row from '../../layout/Row';
import Spacer from '../../layout/Spacer';
import { FileElement, ImportState } from '../../taskpanes/FileImport/FileImportTaskpane';
import { getElementsToDisplay, getFilePath, inRootFolder, isExcelFile } from '../../taskpanes/FileImport/importUtils';
import { TaskpaneType } from '../../taskpanes/taskpanes';
import FileBrowserElement from './FileBrowserElement';
import FileBrowserPathSelector from './FileBrowserPathSelector';


export interface PathContents {
    path_parts: string[],
    elements: FileElement[];
}

export type FileSort = 'name_ascending' | 'name_descending' | 'last_modified_ascending' | 'last_modified_descending';

export interface FileBrowserState {
    pathContents: PathContents,
    sort: FileSort,
    searchString: string,
    selectedElementIndex: number,
    loadingFolder: boolean,
    loadingImport: boolean,
}

interface FileBrowserProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    analysisData: AnalysisData;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;

    currPathParts: string[],
    setCurrPathParts: (newPathParts: string[]) => void;

    fileBrowserState: FileBrowserState;
    setFileBrowserState: React.Dispatch<React.SetStateAction<FileBrowserState>>;

    importCSVFile: (file: FileElement) => Promise<void>;
    setImportState: (newImportState: ImportState) => void;
}

const addImportFolderParamMessage = (): JSX.Element => {
    if (isInStreamlit()) {
        return (
            <>
                <p 
                    className={classNames('text-body-1', 'text-overflow-wrap')}
                    style={{whiteSpace:'pre-wrap'}} // So we handle new line and tabs correctly
                >
                    To use the file browser, configure the folder you want to allow users to 
                    import from.
                </p>
                <Spacer px={10}/>
                <p 
                    className={classNames('text-body-1', 'text-overflow-wrap')}
                    style={{whiteSpace:'pre-wrap'}} // So we handle new line and tabs correctly
                >
                    This is configurable with the <code>import_folder</code> parameter in the <code>spreadsheet</code> component 
                        in your Streamlit application.
                </p>
                <Spacer px={10}/>
                <p
                    className={classNames('text-body-1', 'text-overflow-wrap')}
                    style={{whiteSpace:'pre-wrap'}} // So we handle new line and tabs correctly
                >
                    See our <a className='text-body-link-1' href='https://docs.trymito.io/mito-for-streamlit/api-reference' target='_blank' rel='noreferrer'>docs</a> for more information.
                </p>
            </>
        )
    } else {
        return (
            <>
                <p 
                    className={classNames('text-body-1', 'text-overflow-wrap')}
                    style={{whiteSpace:'pre-wrap'}} // So we handle new line and tabs correctly
                >
                    To use the file browser, configure the folder you want to allow users to 
                    import from.
                </p>
                <Spacer px={10}/>
                <p 
                    className={classNames('text-body-1', 'text-overflow-wrap')}
                    style={{whiteSpace:'pre-wrap'}} // So we handle new line and tabs correctly
                >
                    This is configurable with the <code>import_folder</code> parameter in the <code>Spreadsheet</code> component 
                        in your Dash application.
                </p>
                <Spacer px={10}/>
                <p
                    className={classNames('text-body-1', 'text-overflow-wrap')}
                    style={{whiteSpace:'pre-wrap'}} // So we handle new line and tabs correctly
                >
                    See our <a className='text-body-link-1' href='https://docs.trymito.io/mito-for-dash/api-reference' target='_blank' rel='noreferrer'>docs</a> for more information.
                </p>
            </>
        )
    }
}

/* 
    This file browser component displays a list of files and folders
    and allows a user to navigate through the file and folder. 
*/
function FileBrowserBody(props: FileBrowserProps): JSX.Element {

    const inputRef = useRef<HTMLInputElement>(null);

    // Filter to the searched for elements, and then sort properly
    const elementsToDisplay = getElementsToDisplay(props.fileBrowserState, props.analysisData);
    const selectedFile: FileElement | undefined = elementsToDisplay[props.fileBrowserState.selectedElementIndex];

    useEffect(() => {
        // When the user switches folders, reset the search
        props.setFileBrowserState(prevImportState => {
            return {
                ...prevImportState,
                searchString: ''
            }
        })
        // Also, focus on the search so we can start typing immediately
        inputRef.current?.focus()
    }, [props.fileBrowserState.pathContents.path_parts])

    // We make sure to always focus back on the search input after the selected
    // element changes; this is because if the user clicks on a different element
    // in the file browser, it will focus on this (and thus kill search and nav
    // with the arrow keys)
    useEffect(() => {
        inputRef.current?.focus();
    }, [props.fileBrowserState.selectedElementIndex, props.fileBrowserState.sort])

    const displayUpgradeToPro = inRootFolder(props.fileBrowserState.pathContents.path_parts) && !props.userProfile.isPro;


    /**
     * If we are in streamlit or dash and the user hasn't configured the import folder,
     * we display a message telling them to do so.
     * 
     * This is because the security model of streamlit requires us to know the
     * specific location users can import data from, as we don't just want them
     * to be able to import from anywhere on the server -- there could be private
     * data.
     */
    if (isInDashboard() && !props.analysisData.importFolderData) {
        return addImportFolderParamMessage();

    }

    return (
        <div className='file-browser flexbox-column'>
            <div>
                <FileBrowserPathSelector
                    importFolderData={props.analysisData.importFolderData}
                    setCurrPathParts={props.setCurrPathParts}
                    pathParts={props.fileBrowserState.pathContents.path_parts}
                />
            </div>
            <Row className='border-t-light-gray border-b-light-gray' justify='space-between'>
                <Col 
                    span={16} 
                    className='flexbox-row flexbox-space-between border-r-light-gray'
                    onClick={() => {
                        props.setFileBrowserState(prevImportState => {
                            return {
                                ...prevImportState,
                                sort: prevImportState.sort === 'name_descending' ? 'name_ascending' : 'name_descending'
                            }
                        })
                    }}
                >
                    <p className='text-body-2 pt-5px pb-5px'>
                        Name
                    </p>
                    {props.fileBrowserState.sort.startsWith('name') &&
                        <div className='mr-5px ml-5px'>
                            <SortArrowIcon direction={props.fileBrowserState.sort.endsWith('descending') ? 'descending' : 'ascending'}/>
                        </div>
                    }
                </Col>
                <Col 
                    span={8} 
                    className='flexbox-row flexbox-justify-end text-align-right'
                    onClick={() => {
                        props.setFileBrowserState(prevImportState => {
                            return {
                                ...prevImportState,
                                sort: prevImportState.sort === 'last_modified_descending' ? 'last_modified_ascending' : 'last_modified_descending'
                            }
                        })
                    }}
                >
                    {props.fileBrowserState.sort.startsWith('last_modified') &&
                        <div className='mr-5px ml-5px'>
                            <SortArrowIcon direction={props.fileBrowserState.sort.endsWith('descending') ? 'descending' : 'ascending'}/>
                        </div>
                    }
                    <p 
                        className='text-body-2 pt-5px pb-5px'
                    >
                        Last Modified
                    </p>
                </Col>
            </Row>
            <div className='mt-5px mb-5px'>
                <input
                    // NOTE: we use a raw input as we need to put a ref on this, so we can focus on it,
                    // but as of now we don't support an input with a passed ref (it's complex and confusing)
                    className={classNames('mito-input', 'text-body-2', 'element-width-block')}
                    ref={inputRef}
                    value={props.fileBrowserState.searchString}
                    placeholder='Search the current folder'
                    onChange={(e) => {
                        const newSearchString = e.target.value;
                        props.setFileBrowserState(prevImportState => {
                            return {
                                ...prevImportState,
                                searchString: newSearchString
                            }
                        })
                    }}
                    // We use the onKeyDown function to handle arrow key presses as well as
                    // as if the user wants to import by pressing enter
                    onKeyDown={(e) => {
                        if (e.key == 'ArrowUp') {
                            props.setFileBrowserState(prevImportState => {
                                return {
                                    ...prevImportState,
                                    selectedElementIndex: Math.max(prevImportState.selectedElementIndex - 1, -1)
                                }
                            })
                            e.preventDefault();
                        } else if (e.key === 'ArrowDown') {
                            props.setFileBrowserState(prevImportState => {
                                return {
                                    ...prevImportState,
                                    selectedElementIndex: Math.min(prevImportState.selectedElementIndex + 1, elementsToDisplay.length - 1)
                                }
                            })
                            e.preventDefault();
                        } else if (e.key === 'Enter') {
                            if (!selectedFile) {
                                return;
                            }

                            if (selectedFile.isParentDirectory) {
                                const newPathParts = [...props.fileBrowserState.pathContents.path_parts];
                                newPathParts.pop()
                                props.setCurrPathParts(newPathParts);
                            } else if (selectedFile.isDirectory) {
                                const newPathParts = props.fileBrowserState.pathContents.path_parts || [];
                                newPathParts.push(selectedFile.name);
                                props.setCurrPathParts(newPathParts);
                            } else {
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
                            }
                        }
                    }}
                    width='block'
                    autoFocus
                />
            </div>
            <div className='file-browser-element-list'>
                {displayUpgradeToPro &&
                    <>
                        <Row justify='space-around'>
                            <p className='ma-25px text-align-center text-body-1'>
                                Want to import from a different drive? Consider&nbsp;
                                <a 
                                    onClick={() => {
                                        void props.mitoAPI.log('clicked_pro_button', {
                                            'pro_button_location': 'import_taskpane_root_folder_import',
                                        })

                                        props.setUIState(prevUIState => {
                                            return {
                                                ...prevUIState,
                                                currOpenTaskpane: {type: TaskpaneType.UPGRADE_TO_PRO, proOrEnterprise: 'Pro'},
                                                selectedTabType: 'data'
                                            }
                                        })
                                    }}
                                    className='text-body-1-link' 
                                >
                                    upgrading to Mito Pro
                                </a> or&nbsp;
                                <a 
                                    onClick={() => {
                                        props.setCurrPathParts(['.']);
                                    }}
                                    className='text-body-1-link' 
                                >
                                    go back to current directory.
                                </a>
                            </p>
                        </Row>
                    </>
                }
                {!displayUpgradeToPro &&
                    <>
                        {!props.fileBrowserState.loadingFolder && elementsToDisplay?.map((element, i) => {
                            return (
                                <FileBrowserElement
                                    key={i}
                                    mitoAPI={props.mitoAPI}
                                    index={i}
                                    element={element}
                                    fileBrowserState={props.fileBrowserState}
                                    setFileBrowserState={props.setFileBrowserState}
                                    currPathParts={props.currPathParts}
                                    setCurrPathParts={props.setCurrPathParts}
                                    excelImportEnabled={isExcelImportEnabled(props.userProfile)}
                                    setImportState={props.setImportState}
                                    importCSVFile={props.importCSVFile}
                                    userProfile={props.userProfile}
                                />
                            )
                        })}
                        {props.fileBrowserState.loadingFolder && <p className='text-body-1'>Loading folder contents...</p>}
                    </>
                }
            </div>
        </div>
    )
}

export default FileBrowserBody;