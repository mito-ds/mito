import {
    StreamlitComponentBase,
    withStreamlitConnection,
} from "streamlit-component-lib"
import Mito from '../mito/Mito';
import React, { ReactNode } from "react"
import { MitoResponse, SendFunction, SendFunctionReturnType } from "../mito";
import { getAnalysisDataFromString, getSheetDataArrayFromString, getUserProfileFromString } from "../jupyter/jupyterUtils";

interface State {
    responses: MitoResponse[]
}


// TODO: update these to be correct!
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

/**
 * This wraps the Mito component in a Streamlit component, and 
 * handles passing data from the Mito iframe to the Streamlit backend, and 
 * getting responses back.
 */
class MitoStreamlitWrapper extends StreamlitComponentBase<State> {

    constructor(props: any) {
        super(props);
        this.state = { responses: [] };
    }

    public getResponseData<ResultType>(id: string, maxRetries = MAX_RETRIES): Promise<SendFunctionReturnType<ResultType>> {

        return new Promise((resolve) => {
            let tries = 0;

            const interval = setInterval(() => {
                const unconsumedResponses = [...this.state.responses];
                // Only try at most MAX_RETRIES times
                tries++;

                if (tries > maxRetries) {
                    console.error(`No response on message: {id: ${id}}`);
                    clearInterval(interval);
                    // If we fail, we return an empty response
                    return resolve({
                        error: `No response on message: {id: ${id}}`,
                        errorShort: `No response received`,
                        showErrorModal: false
                    })
                }

                // See if there is an API response to this one specificially
                const index = unconsumedResponses.findIndex((response) =>  response['id'] === id)

                if (index !== -1) {
                    // Clear the interval
                    clearInterval(interval);

                    const response = unconsumedResponses[index];

                    if (response['event'] == 'error') {
                        return resolve({
                            error: response.error,
                            errorShort: response.errorShort,
                            showErrorModal: response.showErrorModal,
                            traceback: response.traceback
                        });
                    }

                    const sharedVariables = response.shared_variables;
                    
                    return resolve({
                        sheetDataArray: sharedVariables ? getSheetDataArrayFromString(sharedVariables.sheet_data_json) : undefined,
                        analysisData: sharedVariables ? getAnalysisDataFromString(sharedVariables.analysis_data_json) : undefined,
                        userProfile: sharedVariables ? getUserProfileFromString(sharedVariables.user_profile_json) : undefined,
                        result: response['data'] as ResultType
                    });
                }
            }, RETRY_DELAY);
        })
    }

    public async send (msg: Record<string, unknown>): Promise<SendFunctionReturnType<any>> {
        // First, get the iframe of the MitoMessagePasser component
        const parentWindow = window.parent;
        const iframes = parentWindow.frames;
        const currentIndex = Array.from(iframes).findIndex(iframe => iframe === window);
        const mitoMessagePasserIframe = iframes[currentIndex - 1];

        // Send it a message that contains the msg
        if (mitoMessagePasserIframe) {
            const mitoMessagePasserWindow = mitoMessagePasserIframe.window;
            mitoMessagePasserWindow.postMessage({'type': 'mito', 'data': msg}, '*');
        }
        
        return await this.getResponseData(msg['id'] as string);
    }
    
    


    public render = (): ReactNode => {

        const sheetDataArray = getSheetDataArrayFromString(this.props.args['sheet_data_json']);
        const analysisData = getAnalysisDataFromString(this.props.args['analysis_data_json']);
        const userProfile = getUserProfileFromString(this.props.args['user_profile_json']);
        const responses = JSON.parse(this.props.args['responses_json']);

        // If we have new responses, add them to the state. Note that this
        // implies that responses are append-only for a given Mito instance.
        if (responses.length > this.state.responses.length) {
            const newResponses = responses.slice(this.state.responses.length);
            
            this.setState(prevState => {
                return {responses: [...prevState.responses, ...newResponses]}
            });
        }
        // If we have less responses, this means we have reset the Mito instance,
        // so we update the responses. TODO: can the Mito widget handle this?
        if (responses.length < this.state.responses.length) {
            this.setState({responses: responses});
        }


        return (
            <Mito 
                key={this.props.args['id'] as string}
                getSendFunction={async () => this.send.bind(this)} 
                sheetDataArray={sheetDataArray} 
                analysisData={analysisData} 
                userProfile={userProfile}
            />  
        )
    }
}

// "withStreamlitConnection" is a wrapper function. It bootstraps the
// connection between your component and the Streamlit app, and handles
// passing arguments from Python -> Component.
export default withStreamlitConnection(MitoStreamlitWrapper)  