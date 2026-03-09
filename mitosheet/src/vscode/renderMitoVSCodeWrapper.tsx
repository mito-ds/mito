/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import * as React from 'react';
import ReactDOM from 'react-dom';
import MitoVSCodeWrapper from './MitoVSCodeWrapper';
import {
    getAnalysisDataFromString,
    getSheetDataArrayFromString,
    getUserProfileFromString,
} from '../jupyter/jupyterUtils';

// We replace the following byte arrays with the real byte arrays of the utf8 encoded
// JSON for the sheet data array, etc. We pass this encoded because the JSON parsing
// when we don't gets really complicated trying to replace \t, etc.
// Do not edit the following lines without updating _get_vscode_frontend_code which searches
// for this code exactly to replace it.
const sheetDataBytes = new Uint8Array(['REPLACE_THIS_WITH_SHEET_DATA_BYTES' as unknown as number]);
const analysisDataBytes = new Uint8Array(['REPLACE_THIS_WITH_ANALYSIS_DATA_BYTES' as unknown as number]);
const userProfileBytes = new Uint8Array(['REPLACE_THIS_WITH_USER_PROFILE_BYTES' as unknown as number]);

const sheetDataArray = getSheetDataArrayFromString(new TextDecoder().decode(sheetDataBytes));
const analysisData = getAnalysisDataFromString(new TextDecoder().decode(analysisDataBytes));
const userProfile = getUserProfileFromString(new TextDecoder().decode(userProfileBytes));

// Python replaces 'REPLACE_THIS_WITH_PORT' with the actual integer port number
const port = 'REPLACE_THIS_WITH_PORT' as unknown as number;

const divID = 'REPLACE_THIS_WITH_DIV_ID';

const css = `REPLACE_THIS_WITH_CSS`;

// Append the style to the head
const style = document.createElement('style');
style.appendChild(document.createTextNode(css));
document.head.append(style);

const div = document.getElementById(divID);

ReactDOM.render(
    <MitoVSCodeWrapper
        port={port}
        sheetDataArray={sheetDataArray}
        analysisData={analysisData}
        userProfile={userProfile}
    />,
    div
);
