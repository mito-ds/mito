import * as React from 'react'
import ReactDOM from 'react-dom';
import Mito from './components/Mito';
import { getAnalysisDataFromString, getSheetDataArrayFromString, getUserProfileFromString } from './jupyter/jupyterUtils';

// We replace the following byte arrays with the real byte arrays of the utf8 encoded
// JSON for the sheet data array, etc. We pass this encoded because the JSON parsing
// when we don't gets really complicated trying to replace \t, etc.
// Do not edit the following lines without updating the get_mito_frontend_code which searches 
// for this code exactly to replace it.
const sheetDataBytes = new Uint8Array([]);
const analysisDataBytes = new Uint8Array([]);
const userProfileBytes = new Uint8Array([]);

const sheetDataArray = getSheetDataArrayFromString(new TextDecoder().decode(sheetDataBytes));
const analysisData = getAnalysisDataFromString(new TextDecoder().decode(analysisDataBytes));
const userProfile = getUserProfileFromString(new TextDecoder().decode(userProfileBytes));

// We create a distinct comm channel for each Mito instance, so that they can 
// each communicate with the backend seperately. We replace these values when
// rendering the mitosheet as well
const commTargetID = 'REPLACE_THIS_WITH_COMM_TARGET_ID';
const divID = 'REPLACE_THIS_WITH_DIV_ID';
const kernelID = 'REPLACE_THIS_WITH_KERNEL_ID';

const css = `REPLACE_THIS_WITH_CSS`;

// Append the style to the head. Note that we need to do this in the JS
// because style tags can only be childen of the head element
const style = document.createElement('style');
style.appendChild(document.createTextNode(css));
document.head.append(style)

// Then, render the mitosheet to the div id
const div = document.getElementById(divID);
console.log("Rendering to div", div);
ReactDOM.render(
    <Mito
        kernelID={kernelID}
        commTargetID={commTargetID}
        sheetDataArray={sheetDataArray}
        analysisData={analysisData}
        userProfile={userProfile}
    />,
    div
)
