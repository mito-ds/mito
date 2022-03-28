// Copyright (c) Mito
// Distributed under the terms of the Modified BSD License.

import React from 'react';
import '../../../../css/taskpanes/Download/DownloadTaskpane.css';
// Import 
import { UIState } from '../../../types';
import DefaultTaskpane from '../DefaultTaskpane/DefaultTaskpane';
import DefaultTaskpaneBody from '../DefaultTaskpane/DefaultTaskpaneBody';
import DefaultTaskpaneHeader from '../DefaultTaskpane/DefaultTaskpaneHeader';



interface DownloadTaskpaneProps {
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
}

/*
    A taskpane that allows a user to download their current sheet.

    It does this by:
    1. Getting a string representation of the sheet through the api
    2. Encoding that as a file
    3. Allowing the user to download that file

    To see more about this process, read documentation here: 
    https://blog.logrocket.com/programmatic-file-downloads-in-the-browser-9a5186298d5c/
*/
const DocsTaskpane = (props: DownloadTaskpaneProps): JSX.Element => {

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader
                header='Documentation'
                setUIState={props.setUIState}   
            />
            <DefaultTaskpaneBody>
                <iframe src='https://docs.trymito.io'></iframe>
            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    )
};

export default DocsTaskpane;