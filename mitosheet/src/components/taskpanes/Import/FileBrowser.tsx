// Copyright (c) Mito
import React, { useEffect, useRef } from 'react';
import FileBrowserElement from './FileBrowserElement';
import FileBrowserPathSelector from './FileBrowserPathSelector';
import { FileElement, ImportTaskpaneState } from './ImportTaskpane';

import '../../../../css/elements/Input.css'
import '../../../../css/taskpanes/Import/FileBrowser.css';
import MitoAPI from '../../../jupyter/api';
import Row from '../../spacing/Row';
import Col from '../../spacing/Col';
import SortArrowIcon from '../../icons/SortArrowIcon';
import { UserProfile } from '../../../types';
import { classNames } from '../../../utils/classNames';
import { getElementsToDisplay } from './importUtils';

interface FileBrowserProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    setCurrPathParts: (newPathParts: string[]) => void;

    importState: ImportTaskpaneState;
    setImportState: React.Dispatch<React.SetStateAction<ImportTaskpaneState>>;

    importElement: (element: FileElement | undefined) => Promise<void>;
}


/* 
    This file browser component displays a list of files and folders
    and allows a user to navigate through the file and folder. 
*/
function FileBrowser(props: FileBrowserProps): JSX.Element {

    const inputRef = useRef<HTMLInputElement>(null);

    // Filter to the searched for elements, and then sort properly
    const elementsToDisplay = getElementsToDisplay(props.importState);
    const selectedElement: FileElement | undefined = elementsToDisplay[props.importState.selectedElementIndex];

    useEffect(() => {
        // When the user switches folders, reset the search
        props.setImportState(prevImportState => {
            return {
                ...prevImportState,
                searchString: ''
            }
        })
        // Also, focus on the search so we can start typing immediately
        inputRef.current?.focus()
    }, [props.importState.pathContents.path_parts])

    // We make sure to always focus back on the search input after the selected
    // element changes; this is because if the user clicks on a different element
    // in the file browser, it will focus on this (and thus kill search and nav
    // with the arrow keys)
    useEffect(() => {
        inputRef.current?.focus();
    }, [props.importState.selectedElementIndex, props.importState.sort])

    return (
        <div className='file-browser flexbox-column'>
            <div>
                <FileBrowserPathSelector
                    setCurrPathParts={props.setCurrPathParts}
                    pathParts={props.importState.pathContents.path_parts}
                />
            </div>
            <Row className='border-t-light-gray border-b-light-gray' justify='space-between'>
                <Col 
                    span={18} 
                    className='flexbox-row flexbox-space-between border-r-light-gray'
                    onClick={() => {
                        props.setImportState(prevImportState => {
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
                    {props.importState.sort.startsWith('name') &&
                        <div className='mr-5px ml-5px'>
                            <SortArrowIcon direction={props.importState.sort.endsWith('descending') ? 'descending' : 'ascending'}/>
                        </div>
                    }
                </Col>
                <Col 
                    span={6} 
                    className='flexbox-row flexbox-justify-end text-align-right'
                    onClick={() => {
                        props.setImportState(prevImportState => {
                            return {
                                ...prevImportState,
                                sort: prevImportState.sort === 'last_modified_descending' ? 'last_modified_ascending' : 'last_modified_descending'
                            }
                        })
                    }}
                >
                    {props.importState.sort.startsWith('last_modified') &&
                        <div className='mr-5px ml-5px'>
                            <SortArrowIcon direction={props.importState.sort.endsWith('descending') ? 'descending' : 'ascending'}/>
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
                    value={props.importState.searchString}
                    placeholder='Search the current folder'
                    onChange={(e) => {
                        const newSearchString = e.target.value;
                        props.setImportState(prevImportState => {
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
                            props.setImportState(prevImportState => {
                                return {
                                    ...prevImportState,
                                    selectedElementIndex: Math.max(prevImportState.selectedElementIndex - 1, -1)
                                }
                            })
                            e.preventDefault();
                        } else if (e.key === 'ArrowDown') {
                            props.setImportState(prevImportState => {
                                return {
                                    ...prevImportState,
                                    selectedElementIndex: Math.min(prevImportState.selectedElementIndex + 1, elementsToDisplay.length - 1)
                                }
                            })
                            e.preventDefault();
                        } else if (e.key === 'Enter') {
                            if (selectedElement && !selectedElement.isDirectory) {
                                void props.importElement(selectedElement)
                            } else if (selectedElement && selectedElement.isDirectory) {
                                const newPathParts = props.importState.pathContents.path_parts || [];
                                newPathParts.push(selectedElement.name);
                                props.setCurrPathParts(newPathParts);
                            }
                        }
                    }}
                    width='block'
                    autoFocus
                />
            </div>
            <div className='file-browser-element-list'>
                {!props.importState.loadingFolder && elementsToDisplay?.map((element, i) => {
                    return (
                        <FileBrowserElement
                            key={i}
                            mitoAPI={props.mitoAPI}
                            index={i}
                            element={element}
                            importState={props.importState}
                            setImportState={props.setImportState}
                            importElement={props.importElement}
                            setCurrPathParts={props.setCurrPathParts}
                            excelImportEnabled={props.userProfile.excelImportEnabled}
                        />
                    )
                })}
                {props.importState.loadingFolder && <p>Loading folder contents...</p>}
            </div>
        </div>
    )
}

export default FileBrowser;