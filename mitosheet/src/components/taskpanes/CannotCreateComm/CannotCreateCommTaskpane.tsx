import React from "react";
import { DOCUMENTATION_LINK_INSTALL } from "../../../data/documentationLinks";
import { UIState, UserProfile } from "../../../types"
import GetSupportButton from "../../elements/GetSupportButton";
import Spacer from "../../layout/Spacer";

import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";


interface CannotCreateCommTaskpaneProps {
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    userProfile: UserProfile
}


/* 
    This is the CannotCreateComm taskpane, which is displayed when
    Mito cannot hook up to the backend properly
*/
const CannotCreateCommTaskpane = (props: CannotCreateCommTaskpaneProps): JSX.Element => {
    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="Cannot Connect to Backend"
                setUIState={props.setUIState}    
                notCloseable       
            />
            <DefaultTaskpaneBody>
                <p>
                    Mito was unable to connect to your Python kernel. This is probably because Mito is installed incorrectly.
                </p>
                <Spacer px={15}/>
                <p>
                    To fix your installation, please ensure you have followed our <a href={DOCUMENTATION_LINK_INSTALL} target='_blank' rel="noreferrer"><span className="text-body-1-link">installation instructions.</span></a>
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