import React from "react";
import MitoAPI from "../../../jupyter/api";
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
    This is the UpdateSnowflakeCredentialsTaskpane taskpane.
*/
const UpdateSnowflakeCredentialsScreen = (props: UpdateSnowflakeCredentialsTaskpaneTaskpaneProps): JSX.Element => {

    
    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="UpdateSnowflakeCredentialsTaskpane"
                setUIState={props.setUIState} 
                backCallback={props.backCallback}
                notCloseable={props.notCloseable}
            />
            <DefaultTaskpaneBody>
                <AuthenticateToSnowflakeCard 
                    mitoAPI={props.mitoAPI}
                    onCredentialsValidated={() => props.edit()}      
                    isOpen={true}          
                />
            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    )
}

export default UpdateSnowflakeCredentialsScreen;