// Copyright (c) Mito
import React from 'react';

interface FileBrowserPathSelectorProps {
    pathParts: string[] | undefined;
    setCurrPathParts: (newPathParts: string[]) => void;
}

/*
const isPathPartWindowsDrive = (path_part: string): boolean => {
    return path_part.length == 2 && path_part[1] === ':'
}
*/

const WINDOWS_DRIVE_PATH = 'windows_drive_path'

/* 
    At the top of the file browser, users can select
    pieces of the path.
*/
function FileBrowserPathSelector(props: FileBrowserPathSelectorProps): JSX.Element {

    console.log('original pathParts: ', props.pathParts)
    const isWindows = window.navigator.userAgent.toUpperCase().includes('WINDOWS')
    let pathParts = props.pathParts 
    if (isWindows && pathParts !== undefined) {
        pathParts = [WINDOWS_DRIVE_PATH].concat(pathParts)
    }
    console.log('created pathParts: ',  pathParts)

    /* 
        Updates the selected path to go back up some number
        of folders to a given index.
    */
    const updateSelectedPath = (i: number): void => {
        if (pathParts === undefined) {
            return;
        }
        const subPathParts = pathParts.slice(0, i + 1);
        if (isWindows) {
            // Remove the WINDOWS_DRIVE_PATH so its a valid path
            subPathParts.splice(0, 1)
            // If the path is now empty, then just send the WINDOWS_DRIVE_PATH so we can display the windows drives
            if (subPathParts.length === 0) {
                subPathParts.push(WINDOWS_DRIVE_PATH)
            }
        }
        console.log('!!!!!path to backend: ', subPathParts)
        props.setCurrPathParts(subPathParts);
    }

    if (pathParts === undefined) {
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
                {pathParts?.map((pathPart, i) => {
                    // If the path part is empty, don't display it
                    if (pathPart === '' || pathPart === '.') {
                        return <React.Fragment key={i}></React.Fragment>
                    }

                    if (i === 0) {
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
                    }
                    
                    /*
                    if (i === 1 && pathParts !== undefined && isPathPartWindowsDrive(pathParts[0]) && (pathPart === '\\' || pathPart === '/')) {
                        // Combine the first and second path parths on windows so that we stick to the Windows File Explorer convention.
                        // The first path part should look like C:/
                        // Note: This only effects the path that we display, not the actual path, so that we don't mess with Python's path system.
                        pathPart = pathParts[0] + pathPart
                    }
                    */

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
                })}
            </div>
        )
    }


    
}

export default FileBrowserPathSelector;