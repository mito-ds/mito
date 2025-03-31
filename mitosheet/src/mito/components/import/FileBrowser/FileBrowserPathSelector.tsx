/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito
import React from 'react';
import DriveIcon from '../../icons/DriveIcon'

interface FileBrowserPathSelectorProps {
    importFolderData: {
        path: string,
        pathParts: string[]
    } | undefined | null;
    pathParts: string[] | undefined;
    setCurrPathParts: (newPathParts: string[]) => void;
}


/* 
    At the top of the file browser, users can select
    pieces of the path.
*/
function FileBrowserPathSelector(props: FileBrowserPathSelectorProps): JSX.Element {

    /* 
        Updates the selected path to go back up some number
        of folders to a given index.
    */
    const updateSelectedPath = (i: number): void => {
        if (props.pathParts === undefined) {
            return;
        }
        const subPathParts = props.pathParts.slice(0, i + 1);
        props.setCurrPathParts(subPathParts);
    }

    const pathPartsAndIndexes = props.pathParts?.map((pathPart, i) => {
        return {
            pathPart: pathPart,
            index: i
        }
    });

    const pathPartsAndIndexesToDisplay = props.importFolderData
        ? pathPartsAndIndexes?.slice((props.importFolderData?.pathParts.length ?? 1) - 1)
        : pathPartsAndIndexes;

    return (
        <div className='file-browser-path-selector'>
            {pathPartsAndIndexesToDisplay?.map((pathPartAndIndex) => {
                const pathPart = pathPartAndIndex.pathPart;
                const i = pathPartAndIndex.index;

                return (
                    <React.Fragment key={i}>
                        <div className='highlight-on-hover file-browser-path-part' key={i} onClick={() => {updateSelectedPath(i)}}>
                            {i === 0 ? <DriveIcon /> : pathPart}
                        </div>
                        <div className='file-browser-path-seperator text-body-1'>
                            &gt;
                        </div>
                    </React.Fragment>
                )
            })}
        </div>
    )
}


export default FileBrowserPathSelector;