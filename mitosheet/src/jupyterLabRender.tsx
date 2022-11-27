import * as React from 'react'
import ReactDOM from 'react-dom';
import Mito from './components/Mito';
import { getCommContainer } from './jupyter/api';
import { getAnalysisDataFromString, getSheetDataArrayFromString, getUserProfileFromString } from './jupyter/jupyterUtils';

// We replace all of the following REPLACE_THIS_WITH... variables with 
// the actual values they should be upon creation of the mitosheet. This is
// how we get data needed at initialization from the mito backend to the 
// frontend

const sheetDataArray = getSheetDataArrayFromString(`REPLACE_THIS_WITH_SHEET_DATA_ARRAY`);
const analysisData = getAnalysisDataFromString(`REPLACE_THIS_WITH_ANALYSIS_DATA`);
const userProfile = getUserProfileFromString(`REPLACE_THIS_WITH_USER_PROFILE`);
// We create a distinct comm channel for each Mito instance, so that they can 
// each communicate with the backend seperately
const commTargetID = 'REPLACE_THIS_WITH_COMM_TARGET_ID';
const divID = 'REPLACE_THIS_WITH_ID';

const css = `REPLACE_THIS_WITH_CSS`;


// We render in an async function so that we can create the comm container
// before creating Mito
const renderMito = async () => {

    // Append the style to the head. Note that we need to do this in the JS
    // because style tags can only be childen of the head element
    const style = document.createElement('style');
    style.appendChild(document.createTextNode(css));
    document.head.append(style)

    // Then, create the comm channel
    const commContainer = await getCommContainer(commTargetID);

    // Then, render the mitosheet to the div id
    const div = document.getElementById(divID);
    ReactDOM.render(
        <Mito
            commContainer={commContainer}
            sheetDataArray={sheetDataArray}
            analysisData={analysisData}
            userProfile={userProfile}
        />,
        div
    )   
}

void renderMito()
