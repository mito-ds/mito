// Copyright (c) Mito
import React, { useEffect, useRef } from 'react';
import { MitoAPI } from '../../../api/api';
import { UserProfile } from '../../../types';
import { getLastModifiedString } from '../../../utils/time';
import { ensureInView } from '../../elements/Dropdown';
import BackArrowIcon from '../../icons/BackArrowIcon';
import CSVFileIcon from '../../icons/CSVFileIcon';
import DirectoryIcon from '../../icons/DirectoryIcon';
import FileIcon from '../../icons/FileIcon';
import Col from '../../layout/Col';
import Row from '../../layout/Row';
import {
    FileElement, ImportState
} from '../../taskpanes/FileImport/FileImportTaskpane';
import { getFilePath, getInvalidFileError, isExcelFile } from '../../taskpanes/FileImport/importUtils';
import { FileBrowserState } from './FileBrowserBody';


interface FileBrowserElementProps {
    mitoAPI: MitoAPI,
    currPathParts: string[],
    setCurrPathParts: (newPathParts: string[]) => void;
    
    fileBrowserState: FileBrowserState;
    setFileBrowserState: React.Dispatch<React.SetStateAction<FileBrowserState>>;
    
    index: number;
    element: FileElement;

    excelImportEnabled: boolean;
    isParentFolder?: boolean;

    importCSVFile: (file: FileElement) => Promise<void>;
    setImportState: (newImportState: ImportState) => void;

    userProfile: UserProfile;
}

/* 
    An file or folder that is displayed by the file browser
*/
function FileBrowserElement(props: FileBrowserElementProps): JSX.Element {

    const elementRef = useRef<HTMLDivElement>(null);

    // Check if this element being displayed is the selected element in the
    // file browser!
    const isSelected = props.index === props.fileBrowserState.selectedElementIndex;

    // If the element becomes selected, we make sure it is visible in the div
    useEffect(() => {
        const element = elementRef.current;
        const parent = elementRef.current?.parentElement;
        if (isSelected && element && parent) {
            ensureInView(parent as HTMLDivElement, elementRef.current, 0)
        }
    }, [isSelected])

    const invalidFileError = getInvalidFileError(props.element, props.userProfile);

    return (
        <div 
            // We make this text unselectable, as we want users to be able to double click
            ref={elementRef}
            className='highlight-on-hover file-browser-element p-5px text-unselectable'
            title={props.element.name}
            style={{background: isSelected ? 'var(--mito-highlight-medium)' : ''}}
            onClick={(e) => {
                // If the user is double clicking, then we don't select or
                // unselect the element
                if (e.detail > 1) {
                    return;
                }

                /* 
                    If the element is selected, we unselect it. Otherwise,
                    we select it.
                */
                if (isSelected) {
                    props.setFileBrowserState(prevImportState => {
                        return {
                            ...prevImportState,
                            selectedElementIndex: -1
                        }
                    });
                } else {
                    props.setFileBrowserState(prevImportState => {
                        return {
                            ...prevImportState,
                            selectedElementIndex: props.index
                        }
                    });
                }
            }}
            onDoubleClick={() => {
                if (props.element.isParentDirectory) {
                    const newPathParts = [...props.fileBrowserState.pathContents.path_parts];
                    newPathParts.pop()
                    props.setCurrPathParts(newPathParts);
                } else if (props.element.isDirectory) {
                    const newPathParts = props.fileBrowserState.pathContents.path_parts || [];
                    newPathParts.push(props.element.name);
                    props.setCurrPathParts(newPathParts);
                } else {
                    
                    if (isExcelFile(props.element)) {
                        const openExcelImport = async () => {
                            const filePath = await getFilePath(props.mitoAPI, props.currPathParts, props.element);
                            if (filePath === undefined) {
                                return;
                            }
                            props.setImportState({
                                screen: 'xlsx_import_config',
                                fileName: props.element.name,
                                filePath: filePath
                            });
                        }

                        void openExcelImport();
                    } else {
                        void props.importCSVFile(props.element);
                    }
                }
            }}
        >
            <Row suppressTopBottomMargin justify='space-between'>
                <Col span={17} offsetRight={1}>
                    <div className='flexbox-row'>
                        <div className='mr-5px mt-2px'>
                            {/* Display a different icon depending on if it's a directory, or if we can import it*/}
                            {props.element.isDirectory && props.element.isParentDirectory && <BackArrowIcon width='14px'/>}
                            {props.element.isDirectory && !props.element.isParentDirectory &&<DirectoryIcon/>}
                            {!props.element.isDirectory && invalidFileError === undefined && <CSVFileIcon/>}
                            {!props.element.isDirectory &&  invalidFileError !== undefined && <FileIcon/>}
                        </div>
                        <div>
                            {props.element.name}
                        </div>
                    </div>
                </Col>
                <Col span={6}>
                    <p className='text-align-right'>
                        {props.element.lastModified !== 0 && getLastModifiedString(props.element.lastModified)}
                    </p>
                </Col>
            </Row>
            {/* If the element is selected but cannot be imported, we present an error */}
            {isSelected && invalidFileError !== undefined &&
                <div className='pl-5px pr-5px'>
                    <span> {invalidFileError} </span>
                </div>
            }
        </div>
    )
}

export default FileBrowserElement;