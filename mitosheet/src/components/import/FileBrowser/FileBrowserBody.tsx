// Copyright (c) Mito
import React, { useEffect, useRef, useState } from 'react';
import FileBrowserElement from './FileBrowserElement';
import FileBrowserPathSelector from './FileBrowserPathSelector';
import { FileElement } from '../../taskpanes/FileImport/ImportTaskpane';

import '../../../../css/elements/Input.css'
import '../../../../css/taskpanes/Import/FileBrowser.css';
import MitoAPI from '../../../jupyter/api';
import Row from '../../layout/Row';
import Col from '../../layout/Col';
import SortArrowIcon from '../../icons/SortArrowIcon';
import { UIState, UserProfile } from '../../../types';
import { classNames } from '../../../utils/classNames';
import { getElementsToDisplay, inRootFolder } from '../../taskpanes/FileImport/importUtils';
import { TaskpaneType } from '../../taskpanes/taskpanes';


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
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;

    currPathParts: string[],
    setCurrPathParts: (newPathParts: string[]) => void;

    selectFile: (element: FileElement | undefined) => Promise<void>;
}


/* 
    This file browser component displays a list of files and folders
    and allows a user to navigate through the file and folder. 
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

    const inputRef = useRef<HTMLInputElement>(null);

    // Filter to the searched for elements, and then sort properly
    const elementsToDisplay = getElementsToDisplay(fileBrowserState);
    const selectedElement: FileElement | undefined = elementsToDisplay[fileBrowserState.selectedElementIndex];

    useEffect(() => {
        // When the user switches folders, reset the search
        setFileBrowserState(prevImportState => {
            return {
                ...prevImportState,
                searchString: ''
            }
        })
        // Also, focus on the search so we can start typing immediately
        inputRef.current?.focus()
    }, [fileBrowserState.pathContents.path_parts])

    // We make sure to always focus back on the search input after the selected
    // element changes; this is because if the user clicks on a different element
    // in the file browser, it will focus on this (and thus kill search and nav
    // with the arrow keys)
    useEffect(() => {
        inputRef.current?.focus();
    }, [fileBrowserState.selectedElementIndex, fileBrowserState.sort])

    const displayUpgradeToPro = inRootFolder(fileBrowserState.pathContents.path_parts) && !props.userProfile.isPro;

    return (
        <div className='file-browser flexbox-column'>
            <div>
                <FileBrowserPathSelector
                    setCurrPathParts={props.setCurrPathParts}
                    pathParts={fileBrowserState.pathContents.path_parts}
                />
            </div>
            <Row className='border-t-light-gray border-b-light-gray' justify='space-between'>
                <Col 
                    span={18} 
                    className='flexbox-row flexbox-space-between border-r-light-gray'
                    onClick={() => {
                        setFileBrowserState(prevImportState => {
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
                    {fileBrowserState.sort.startsWith('name') &&
                        <div className='mr-5px ml-5px'>
                            <SortArrowIcon direction={fileBrowserState.sort.endsWith('descending') ? 'descending' : 'ascending'}/>
                        </div>
                    }
                </Col>
                <Col 
                    span={6} 
                    className='flexbox-row flexbox-justify-end text-align-right'
                    onClick={() => {
                        setFileBrowserState(prevImportState => {
                            return {
                                ...prevImportState,
                                sort: prevImportState.sort === 'last_modified_descending' ? 'last_modified_ascending' : 'last_modified_descending'
                            }
                        })
                    }}
                >
                    {fileBrowserState.sort.startsWith('last_modified') &&
                        <div className='mr-5px ml-5px'>
                            <SortArrowIcon direction={fileBrowserState.sort.endsWith('descending') ? 'descending' : 'ascending'}/>
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
                    value={fileBrowserState.searchString}
                    placeholder='Search the current folder'
                    onChange={(e) => {
                        const newSearchString = e.target.value;
                        setFileBrowserState(prevImportState => {
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
                            setFileBrowserState(prevImportState => {
                                return {
                                    ...prevImportState,
                                    selectedElementIndex: Math.max(prevImportState.selectedElementIndex - 1, -1)
                                }
                            })
                            e.preventDefault();
                        } else if (e.key === 'ArrowDown') {
                            setFileBrowserState(prevImportState => {
                                return {
                                    ...prevImportState,
                                    selectedElementIndex: Math.min(prevImportState.selectedElementIndex + 1, elementsToDisplay.length - 1)
                                }
                            })
                            e.preventDefault();
                        } else if (e.key === 'Enter') {
                            if (!selectedElement) {
                                return;
                            }

                            if (selectedElement.isParentDirectory) {
                                const newPathParts = [...fileBrowserState.pathContents.path_parts];
                                newPathParts.pop()
                                props.setCurrPathParts(newPathParts);
                            } else if (selectedElement.isDirectory) {
                                const newPathParts = fileBrowserState.pathContents.path_parts || [];
                                newPathParts.push(selectedElement.name);
                                props.setCurrPathParts(newPathParts);
                            } else {
                                void props.selectFile(selectedElement);
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
                                                currOpenTaskpane: {type: TaskpaneType.UPGRADE_TO_PRO},
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
                        {!fileBrowserState.loadingFolder && elementsToDisplay?.map((element, i) => {
                            return (
                                <FileBrowserElement
                                    key={i}
                                    mitoAPI={props.mitoAPI}
                                    index={i}
                                    element={element}
                                    fileBrowserState={fileBrowserState}
                                    setFileBrowserState={setFileBrowserState}
                                    selectFile={props.selectFile}
                                    setCurrPathParts={props.setCurrPathParts}
                                    excelImportEnabled={props.userProfile.excelImportEnabled}
                                />
                            )
                        })}
                        {fileBrowserState.loadingFolder && <p>Loading folder contents...</p>}
                    </>
                }
            </div>
        </div>
    )
}

export default FileBrowser;