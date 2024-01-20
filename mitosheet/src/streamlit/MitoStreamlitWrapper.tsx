import { Mito, MitoResponse, MitoTheme, SendFunctionReturnType } from "mitosheet-frontend";
import React, { ReactNode } from "react";
import {
    Streamlit,
    StreamlitComponentBase,
    Theme,
    withStreamlitConnection
} from "streamlit-component-lib";
import { getAnalysisDataFromString, getSheetDataArrayFromString, getUserProfileFromString } from "../jupyter/jupyterUtils";


interface State {
    responses: MitoResponse[],
    analysisName: string,
}

// Max delay is the longest we'll wait for the API to return a value
// There is no real reason for these to expire, so we set it very high
// at 5 minutes
const MAX_DELAY = 5 * 60_000;
export const RETRY_DELAY = 25;
export const MAX_RETRIES = MAX_DELAY / RETRY_DELAY;


/**
 * A helper for getting the Mito theme from the Streamlit theme. Notably, 
 * if streamlit is just in default light mode, then we return undefined 
 */
const getMitoThemeFromStreamlitTheme = (streamlitTheme: Theme | undefined): MitoTheme | undefined => {
    if (streamlitTheme === undefined) {
        return undefined
    }    

    if (streamlitTheme.base === 'light') {
        // If it's the default light theme, we simply include the variables that are
        // different from the default. This is because we like our light-mode styling, and
        // want to keep as much of it as we can
        const mitoTheme: MitoTheme = {
            primaryColor: undefined,
            backgroundColor: undefined,
            secondaryBackgroundColor: undefined,
            textColor: undefined,
        }

        let set = false;
        if (streamlitTheme.primaryColor !== '#ff4b4b') {
            mitoTheme.primaryColor = streamlitTheme.primaryColor;
            set = true;
        }
        if (streamlitTheme.backgroundColor !== '#ffffff') {
            mitoTheme.backgroundColor = streamlitTheme.backgroundColor;
            set = true;
        }
        if (streamlitTheme.secondaryBackgroundColor !== '#f0f2f6') {
            mitoTheme.secondaryBackgroundColor = streamlitTheme.secondaryBackgroundColor;
            set = true;
        }
        if (streamlitTheme.textColor !== '#31333F') {
            mitoTheme.textColor = streamlitTheme.textColor;
            set = true;
        }

        if (set) {
            return mitoTheme;
        } else {
            return undefined;
        }
    }

    
    return streamlitTheme;
}


/**
 * This wraps the Mito component in a Streamlit component, and 
 * handles passing data from the Mito iframe to the Streamlit backend, and 
 * getting responses back.
 */
class MitoStreamlitWrapper extends StreamlitComponentBase<State> {

    constructor(props: any) {
        super(props);
        this.state = { 
            responses: [], analysisName: '',
        };
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

    public async send(msg: Record<string, unknown>): Promise<SendFunctionReturnType<any>> {

        // We inject the analysisName into the message, so that the backend
        // can make sure it's getting the right message for the right
        // analysis. This is necessary in streamlit as the message passing
        // component "sends" messages even when a new backend is created - and 
        // we don't want to send old messages to the new backend!
        msg['analysis_name'] = this.state.analysisName;

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
        
        const response = await this.getResponseData(msg['id'] as string);        
        return response;
    }
    
    
    public render = (): ReactNode => {

        const returnType = this.props.args['return_type'] as string;
        const sheetDataArray = getSheetDataArrayFromString(this.props.args['sheet_data_json']);
        const analysisData = getAnalysisDataFromString(this.props.args['analysis_data_json']);
        const userProfile = getUserProfileFromString(this.props.args['user_profile_json']);
        const responses = JSON.parse(this.props.args['responses_json']);

        // If we have new responses, add them to the state. Note that this
        // implies that responses are append-only for a given Mito instance.
        if (responses.length > this.state.responses.length) {
            const newResponses = responses.slice(this.state.responses.length);
            
            this.setState(prevState => {
                return {
                    responses: [...prevState.responses, ...newResponses],
                }
            });
        }
        // If we have less responses, this means we have reset the Mito instance,
        // so we update the responses. TODO: can the Mito widget handle this?
        if (responses.length < this.state.responses.length) {
            this.setState({responses: responses});
        }

        this.setState({analysisName: analysisData.analysisName});

        return (
            <Mito 
                key={this.props.args['id'] as string}
                getSendFunction={async () => this.send.bind(this)} 
                sheetDataArray={sheetDataArray} 
                analysisData={analysisData} 
                userProfile={userProfile}
                theme={getMitoThemeFromStreamlitTheme(this.props.theme)}
                // Only define the onSelectionChange callback if we are returning the selection - so we
                // don't set the component value unnecessarily (trigger reruns)
                onSelectionChange={returnType === 'selection' ? (selectedDataframeIndex, selections) => {
                    // Note that we don't mind if some values are debounced, since we only need
                    // the most recent value -- unlike message sending where we can't miss any
                    Streamlit.setComponentValue({
                        selectedDataframeIndex, 
                        selections
                    });
                }: undefined}
            />  
        )
    }
}

// "withStreamlitConnection" is a wrapper function. It bootstraps the
// connection between your component and the Streamlit app, and handles
// passing arguments from Python -> Component.
export default withStreamlitConnection(MitoStreamlitWrapper)  