import Mito from '../mito/Mito';
import React, { Component } from "react"
import { MitoResponse, SendFunctionReturnType } from "../mito";
import { getAnalysisDataFromString, getSheetDataArrayFromString, getUserProfileFromString } from "../jupyter/jupyterUtils";

export const DELAY_BETWEEN_SET_DASH_PROPS = 25;


interface State {
    responses: MitoResponse[],
    analysisName: string,
    messageQueue: Record<string, any>[],
    isSendingMessages: boolean,
}

type AllJson = {
    key: string,
    sheet_data_json: string,
    analysis_data_json: string,
    user_profile_json: string
    responses_json: string,
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
    processMessageQueueTimer: null | NodeJS.Timeout;

    constructor(props: Props) {
        super(props);
        this.state = { responses: [], analysisName: '', messageQueue: [], isSendingMessages: false };
        this.processMessageQueueTimer = null; // Variable to store the timer
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


    processQueue = () => {
        if (this.state.messageQueue.length > 0) {
            // Send one message
            const message = this.state.messageQueue[0];
            this.props.setProps({
                'message': message
            })

            // Remove the processed message from the queue - making sure
            // to avoid merge conflicts by finding by value
            this.setState((prevState) => {
                const messageQueue = [...prevState.messageQueue];
                const index = messageQueue.findIndex((m) => m === message);
                messageQueue.splice(index, 1);

                return { 
                    messageQueue,
                    isSendingMessages: messageQueue.length > 0,
                };
            });

            // Set a timer to process the next message after a delay
            this.processMessageQueueTimer = setTimeout(this.processQueue, DELAY_BETWEEN_SET_DASH_PROPS);
        } else {
            // Otherwise, we have processed the full queue
            this.setState({ isSendingMessages: false });
        }
    };
    
    handleMitoEvent = (message: Record<string, unknown>) => {
        // TODO: I think we have to check the origin here, but I'm not sure
        // how to do that.

        // We don't send log events, we have a limited messaging budget for performance reasons
        // and because there is debouncing that cause messages to get lost. 
        if (message.event === 'log_event') {
            return
        }
    
        // Add the message to the queue
        this.setState((prevState) => ({
            messageQueue: [...prevState.messageQueue, message],
        }));
    
        // Do some work to make sure we avoid race conditions. Namely, we only want to
        // start processing the queue if we are not already processing the queue.
        let processQueue = false;
        this.setState(prevState => {
            if (!prevState.isSendingMessages) {
                processQueue = true;
            }
            return { isSendingMessages: true };
        }, () => {
            if (processQueue) {
                this.processQueue();
            }
        });
    };


    public async send(msg: Record<string, unknown>): Promise<SendFunctionReturnType<any>> {
        this.handleMitoEvent(msg);
        const response = await this.getResponseData(msg['id'] as string);        
        return response;
    }
    
    
    render = () => {

        const {all_json} = this.props;
        const {sheet_data_json, analysis_data_json, user_profile_json, responses_json, key} = JSON.parse(all_json) as AllJson;
    

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

        console.log('analsyisData', analysisData.theme)

        return (
            <Mito 
                key={key as string}
                getSendFunction={async () => this.send.bind(this)} 
                sheetDataArray={sheetDataArray} 
                analysisData={analysisData} 
                userProfile={userProfile}
                theme={analysisData.theme ?? undefined}
                onSelectionChange={(selectedDataframeIndex, selections) => {
                    void this.send({
                        'type': 'selection_event',
                        'indexAndSelections': {
                            selectedDataframeIndex, 
                            selections
                        }
                    })
                }}
            />  
        )
    }
}