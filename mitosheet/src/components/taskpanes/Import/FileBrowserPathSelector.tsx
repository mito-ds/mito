// Copyright (c) Mito
import React from 'react';

interface FileBrowserPathSelectorProps {
    pathParts: string[] | undefined;
    setCurrPathParts: (newPathParts: string[]) => void;
}

const isPathPartWindowsDrive = (path_part: string): boolean => {
    return path_part.length == 2 && path_part[1] === ':'
}

/* 
    At the top of the file browser, users can select
    pieces of the path.
*/
function FileBrowserPathSelector(props: FileBrowserPathSelectorProps): JSX.Element {

    console.log(props.pathParts)

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

    if (props.pathParts === undefined) {
        return (
            <React.Fragment key={0}>
                <div className='file-browser-path-part' key={0} onClick={() => {updateSelectedPath(0)}}>
                    Drive
                </div>
                <div className='file-browser-path-seperator'>
                    &gt;
                </div>
            </React.Fragment>
        )
    } else {
        return (
            <div className='flexbox-row file-browser-path-selector'>
                {[
                    <React.Fragment key={0}>
                        <div className='file-browser-path-part' key={0} onClick={() => {updateSelectedPath(0)}}>
                            Drive
                        </div>
                        <div className='file-browser-path-seperator'>
                            &gt;
                        </div>
                    </React.Fragment>
                ].concat(props.pathParts?.map((pathPart, i) => {
                    // If the path part is empty, don't display it
                    if (pathPart === '' || i === 0) {
                        return <React.Fragment key={i}></React.Fragment>
                    }
                        
                    if (i === 1 && props.pathParts !== undefined && isPathPartWindowsDrive(props.pathParts[0]) && (pathPart === '\\' || pathPart === '/')) {
                        // Combine the first and second path parths on windows so that we stick to the Windows File Explorer convention.
                        // The first path part should look like C:/
                        // Note: This only effects the path that we display, not the actual path, so that we don't mess with Python's path system.
                        pathPart = props.pathParts[0] + pathPart
                    }

                    return (
                        <React.Fragment key={i}>
                            <div className='file-browser-path-part' key={i} onClick={() => {updateSelectedPath(i)}}>
                                {pathPart}
                            </div>
                            <div className='file-browser-path-seperator'>
                                &gt;
                            </div>
                        </React.Fragment>
                    )
                }))}
            </div>
        )
    }


    
}

export default FileBrowserPathSelector;