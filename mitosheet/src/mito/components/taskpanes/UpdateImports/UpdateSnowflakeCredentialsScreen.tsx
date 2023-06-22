import React from "react";
import { MitoAPI } from "../../../api/api";
import { UIState } from "../../../types"

import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import AuthenticateToSnowflakeCard from "../../elements/AuthenticateToSnowflakeCard";


interface UpdateSnowflakeCredentialsTaskpaneTaskpaneProps {
    mitoAPI: MitoAPI;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    edit: () => void;
    backCallback: () => void;
    notCloseable?: boolean;
}

/* 
    This is the UpdateSnowflakeCredentialsScreen. It is used to re-enter your snowflake
    credentials after the kernel has restarted.
*/
const UpdateSnowflakeCredentialsScreen = (props: UpdateSnowflakeCredentialsTaskpaneTaskpaneProps): JSX.Element => {

    
    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="Connect to Snowflake"
                setUIState={props.setUIState} 
                backCallback={props.backCallback}
                notCloseable={props.notCloseable}
            />
            <DefaultTaskpaneBody>
                <AuthenticateToSnowflakeCard 
                    mitoAPI={props.mitoAPI}
                    onValidCredentials={() => props.edit()}      
                    isOpen={true}          
                />
            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    )
}

export default UpdateSnowflakeCredentialsScreen;