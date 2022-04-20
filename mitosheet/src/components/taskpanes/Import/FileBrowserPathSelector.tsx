// Copyright (c) Mito
import React from 'react';

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
        <div className='flexbox-row file-browser-path-selector'>
            {props.pathParts?.map((pathPart, i) => {

                // We do not display the leading part of the path that
                // does not add anything to the users information
                if (pathPart === '/' || pathPart === '' || pathPart == 'C:' || pathPart === 'D:') {
                    return <React.Fragment key={i}></React.Fragment>
                }

                return (
                    <React.Fragment key={i}>
                        <div className='file-browser-path-part' key={i} onClick={() => {updateSelectedPath(i)}}>
                            {pathPart}
                        </div>
                        <div className='file-browser-path-seperator'>
                            /
                        </div>
                    </React.Fragment>
                )
            })}
        </div>
    )
}

export default FileBrowserPathSelector;