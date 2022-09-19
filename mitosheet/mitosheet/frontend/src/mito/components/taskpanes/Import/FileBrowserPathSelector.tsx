// Copyright (c) Mito
import React from 'react';
import DriveIcon from '../../icons/DriveIcon'

interface FileBrowserPathSelectorProps {
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

    return (
        <div className='file-browser-path-selector'>
            {props.pathParts?.map((pathPart, i) => {
                return (
                    <React.Fragment key={i}>
                        <div className='file-browser-path-part' key={i} onClick={() => {updateSelectedPath(i)}}>
                            {i === 0 ? <DriveIcon /> : pathPart}
                        </div>
                        <div className='file-browser-path-seperator'>
                            &gt;
                        </div>
                    </React.Fragment>
                )
            })}
        </div>
    )
}


export default FileBrowserPathSelector;