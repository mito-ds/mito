// Copyright (c) Mito
import React from 'react';
import MitoAPI from '../../../api';
import { DOCUMENTATION_LINK_IMPORT } from '../../../data/documentationLinks';
import { getLastModifiedString } from '../../../utils/time';
import CSVFileIcon from '../../icons/CSVFileIcon';
import DirectoryIcon from '../../icons/DirectoryIcon';
import FileIcon from '../../icons/FileIcon';
import Col from '../../spacing/Col';
import Row from '../../spacing/Row';
import { FileElement } from './ImportTaskpane';

interface FileBrowserElementProps {
    mitoAPI: MitoAPI,
    pathParts: string[] | undefined,
    setCurrPathParts: (newPathParts: string[]) => void;
    element: FileElement;
    selectedElement: FileElement | undefined;
    setSelectedElement: (newSelectedElement: FileElement | undefined) => void;
    importElement: (element: FileElement | undefined) => Promise<void>;
    excelImportEnabled: boolean;
}

/* 
    Helper function that gets an ending of a file, or
    undefined if no such file ending exists
*/
export const getFileEnding = (elementName: string): string | undefined => {
    try {
        // Take just the file ending
        const nameSplit = elementName.split('.');
        return nameSplit[nameSplit.length - 1];
    } catch {
        return undefined;
    }
}


/* 
    Helper function that, for a given file, returns if there is an 
    error in importing the file. 

    Helpful in displaying in-place errors that tells users they cannot
    import xlsx files.
*/
export const getInvalidFileError = (selectedElement: FileElement, excelImportEnabled: boolean): string | undefined => {
    // We do not display an error on directories, as you cannot
    // import them but we don't want to overload you
    if (selectedElement.isDirectory) {
        return undefined;
    }
    
    const VALID_FILE_ENDINGS = [
        'csv',
        'tsv',
        'txt',
        'tab',
    ]

    // If excel import is enabled, then add it as a valid ending
    if (excelImportEnabled) {
        VALID_FILE_ENDINGS.push('xlsx');
    }

    // Check if the file ending is a type that we support out of the box
    for (const ending of VALID_FILE_ENDINGS) {
        if (selectedElement.name.toLowerCase().endsWith(ending)) {
            return undefined;
        }
    }

    // We try and get the ending from the file
    const fileEnding = getFileEnding(selectedElement.name);
    if (fileEnding === undefined) {
        return 'Sorry, we don\'t support that file type.'
    } else if (fileEnding == 'xlsx') {
        return 'Upgrade to pandas>=0.25.0 and Python>3.6 to import Excel files.'
    } else {
        return `Sorry, we don't support ${fileEnding} files.`
    }
}

/* 
    An file or folder that is displayed by the file browser
*/
function FileBrowserElement(props: FileBrowserElementProps): JSX.Element {


    // Check if this element being displayed is the selected element in the
    // file browser!
    const isSelected = props.selectedElement !== undefined 
        && props.element.isDirectory === props.selectedElement.isDirectory
        && props.element.name === props.selectedElement.name;

    const invalidFileError = getInvalidFileError(props.element, props.excelImportEnabled);

    return (
        <div 
            // NOTE: we make this text unselectable, as we want users
            // to be able to double click
            className='file-browser-element p-5px text-unselectable'
            title={props.element.name} // give it a little something on the hover
            style={{background: isSelected ? '#D5C0FF' : ''}}
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
                    props.setSelectedElement(undefined);
                } else {
                    props.setSelectedElement(props.element)
                }
            }}
            onDoubleClick={() => {
                if (props.element.isDirectory) {
                    const newPathParts = props.pathParts ? props.pathParts : [];
                    newPathParts.push(props.element.name);
                    props.setCurrPathParts(newPathParts);
                } else {
                    void props.importElement(props.element);
                }
            }}
        >
            <Row suppressTopBottomMargin justify='space-between'>
                <Col span={17} offsetRight={1}>
                    <div className='flexbox-row'>
                        <div className='mr-5px mt-2px'>
                            {/* Display a different icon depending on if it's a directory, or if we can import it*/}
                            {props.element.isDirectory && <DirectoryIcon/>}
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
                        {getLastModifiedString(props.element.lastModified)}
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