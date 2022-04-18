// Copyright (c) Mito
import React, { useEffect, useState } from 'react';
import FileBrowserElement from './FileBrowserElement';
import FileBrowserPathSelector from './FileBrowserPathSelector';
import { FileElement } from './ImportTaskpane';

import '../../../../css/taskpanes/Import/FileBrowser.css';
import MitoAPI from '../../../jupyter/api';
import Input from '../../elements/Input';
import { fuzzyMatch } from '../../../utils/strings';
import Row from '../../spacing/Row';
import Col from '../../spacing/Col';
import SortArrowIcon from '../../icons/SortArrowIcon';
import { UserProfile } from '../../../types';

interface FileBrowserProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    selectedElement: FileElement | undefined;
    setSelectedElement: (newSelectedElement: FileElement | undefined) => void;
    importElement: (element: FileElement | undefined) => Promise<void>;

    setCurrPathParts: (newPathParts: string[]) => void;

    pathParts: string[] | undefined;
    elements: FileElement[];
}

type FileSort = 'name_ascending' | 'name_descending' | 'last_modified_ascending' | 'last_modified_descending';

/* 
    This file browser component displays a list of files and folders
    and allows a user to navigate through the file and folder. 
*/
function FileBrowser(props: FileBrowserProps): JSX.Element {

    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<FileSort>('last_modified_descending')

    // Filter to the searched for elements, and then sort properly
    const elementsToDisplay = props.elements?.filter(element => {
        return fuzzyMatch(element.name, search) > .8;
    }).sort((elementOne, elementTwo) => {
        if (sort === 'name_ascending') {
            return elementOne.name < elementTwo.name ? -1 : 1;
        } else if (sort === 'name_descending') {
            return elementOne.name >= elementTwo.name ? -1 : 1;
        } else if (sort === 'last_modified_ascending') {
            return elementOne.lastModified < elementTwo.lastModified ? -1 : 1;
        } else {
            return elementOne.lastModified >= elementTwo.lastModified ? -1 : 1;
        }
    })

    useEffect(() => {
        // When the user switches folders, reset the search
        setSearch('')
    }, [props.pathParts])

    return (
        <div className='file-browser flexbox-column'>
            <div>
                <FileBrowserPathSelector
                    setCurrPathParts={props.setCurrPathParts}
                    pathParts={props.pathParts}
                />
            </div>
            <Row className='border-t-light-gray border-b-light-gray' justify='space-between'>
                <Col 
                    span={18} 
                    className='flexbox-row flexbox-space-between border-r-light-gray'
                    onClick={() => {
                        setSort(sort === 'name_descending' ? 'name_ascending' : 'name_descending');
                    }}
                >
                    <p className='text-body-2 pt-5px pb-5px'>
                        Name
                    </p>
                    {sort.startsWith('name') &&
                        <div className='mr-5px ml-5px'>
                            <SortArrowIcon direction={sort.endsWith('descending') ? 'descending' : 'ascending'}/>
                        </div>
                    }
                </Col>
                <Col 
                    span={6} 
                    className='flexbox-row flexbox-justify-end text-align-right'
                    onClick={() => {
                        setSort(sort === 'last_modified_descending' ? 'last_modified_ascending' : 'last_modified_descending');
                    }}
                >
                    {sort.startsWith('last_modified') &&
                        <div className='mr-5px ml-5px'>
                            <SortArrowIcon direction={sort.endsWith('descending') ? 'descending' : 'ascending'}/>
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
                <Input
                    value={search}
                    placeholder='Search the current folder'
                    onChange={(e) => {setSearch(e.target.value)}}
                    width='block'
                    autoFocus
                    // TODO: allow the user to scroll with arrow keys
                />
            </div>
            <div className='file-browser-element-list'>
                {elementsToDisplay?.map((element, i) => {
                    return (
                        <FileBrowserElement
                            mitoAPI={props.mitoAPI}
                            key={i}
                            element={element}
                            selectedElement={props.selectedElement}
                            setSelectedElement={props.setSelectedElement}
                            importElement={props.importElement}
                            pathParts={props.pathParts}
                            setCurrPathParts={props.setCurrPathParts}
                            excelImportEnabled={props.userProfile.excelImportEnabled}
                    
                        />
                    )
                })}
            </div>
        </div>
    )
}

export default FileBrowser;