import Mito from '../mito/Mito';
import React, { Component } from "react"
import { MitoResponse, SendFunctionReturnType } from "../mito";
import { getAnalysisDataFromString, getSheetDataArrayFromString, getUserProfileFromString } from "../jupyter/jupyterUtils";


interface State {
    responses: MitoResponse[],
    analysisName: string,
}

interface Props {
    id: string,
    all_json: string,
    setProps: (props: Record<string, unknown>) => void
}

// Max delay is the longest we'll wait for the API to return a value
// There is no real reason for these to expire, so we set it very high
// at 5 minutes
const MAX_DELAY = 5 * 60_000;
export const RETRY_DELAY = 25;
export const MAX_RETRIES = MAX_DELAY / RETRY_DELAY;



export default class MitoDashWrapper extends Component<Props, State> {
    
    constructor(props: Props) {
        super(props);
        this.state = { responses: [], analysisName: '' };
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

        this.props.setProps({
            'message': msg
        })
        
        const response = await this.getResponseData(msg['id'] as string);        
        return response;
    }
    
    
    render = () => {

        const {id, all_json} = this.props;
        const {sheet_data_json, analysis_data_json, user_profile_json, responses_json} = JSON.parse(all_json)
    

        const sheetDataArray = getSheetDataArrayFromString(sheet_data_json);
        const analysisData = getAnalysisDataFromString(analysis_data_json);
        const userProfile = getUserProfileFromString(user_profile_json);
        const responses = JSON.parse(responses_json);


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

        return (
            <Mito 
                key={id as string}
                getSendFunction={async () => this.send.bind(this)} 
                sheetDataArray={sheetDataArray} 
                analysisData={analysisData} 
                userProfile={userProfile}
                // TODO: figure out selection on Dash
                onSelectionChange={undefined}
            />  
        )
    }
}