/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from "react";
import { DOCUMENTATION_LINK_INSTALL } from "../../../data/documentationLinks";
import { UIState, UserProfile } from "../../../types"
import GetSupportButton from "../../elements/GetSupportButton";
import Spacer from "../../layout/Spacer";

import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import { SendFunctionError } from "../../../api/send";


interface CannotCreateCommTaskpaneProps {
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    userProfile: UserProfile
    commCreationErrorStatus: SendFunctionError
}


/* 
    This is the CannotCreateComm taskpane, which is displayed when
    Mito cannot hook up to the backend properly
*/
const CannotCreateCommTaskpane = (props: CannotCreateCommTaskpaneProps): JSX.Element => {

    let header = ''
    let firstLine: React.ReactNode = ''
    let secondLine: React.ReactNode = ''
    if (props.commCreationErrorStatus === 'no_backend_comm_registered_error') {
        header = 'Rerun Cell Above'
        firstLine = 'Looks like you restarted your kernel.'
        secondLine = (<>Rerun the <code>mitosheet.sheet()</code> call above to refresh this mitosheet.</>)
    } else if (props.commCreationErrorStatus === 'non_valid_location_error') {
        header = 'Unsupported Enviornment'
        firstLine = 'Mito only supports JupyterLab and Jupyter Notebook, not wherever this is.'
        secondLine = (<>To install Mito in JupyterLab and Jupyter Notebook, follow our <a href={DOCUMENTATION_LINK_INSTALL} target='_blank' rel="noreferrer"><span className="text-body-1-link">installation instructions.</span></a></>)
    } else if (props.commCreationErrorStatus === 'non_working_extension_error') {
        header = 'Invalid installation'
        firstLine = 'Try restarting your JupyterLab. Mito was unable to connect to your Python kernel.'
        secondLine = (<>If this does not resolve this error, please ensure you have followed our <a href={DOCUMENTATION_LINK_INSTALL} target='_blank' rel="noreferrer"><span className="text-body-1-link">installation instructions.</span></a></>)
    }

    return (
        <DefaultTaskpane setUIState={props.setUIState}>
            <DefaultTaskpaneHeader 
                header={header}
                setUIState={props.setUIState}    
                notCloseable       
            />
            <DefaultTaskpaneBody>
                <p>
                    {firstLine}
                </p>
                <Spacer px={15}/>
                <p>
                    {secondLine}
                </p>
                <Spacer px={15}/>
                <p>
                    If you are still receiving this error message, join our slack to get support! 
                </p>
                <Spacer px={15}/>
                <GetSupportButton userProfile={props.userProfile} setUIState={props.setUIState} width='block'/>
            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    )
}

export default CannotCreateCommTaskpane;