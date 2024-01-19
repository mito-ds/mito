
import Mito from '../mito/Mito';
import React, { Component } from "react"
import { MitoResponse, SendFunctionReturnType } from "../mito";
import { getAnalysisDataFromString, getSheetDataArrayFromString, getUserProfileFromString } from "../jupyter/jupyterUtils";
import { getRandomId } from '../mito/api/api';

export const DELAY_BETWEEN_SET_DASH_PROPS = 25;

// When updating the props of the frontend component, we are either sending a message
// to the MitoBackend, or we are just updating the selection. These are the two props names
// we could be setting. 
type PropNameForSetProps = 'message' | 'index_and_selections';

interface State {
    responses: MitoResponse[],
    analysisName: string,
    messageQueue: [PropNameForSetProps, Record<string, any>][],
    isSendingMessages: boolean,
    session_key: string
}

type AllJson = {
    key: string,
    sheet_data_json: string,
    analysis_data_json: string,
    user_profile_json: string
    responses_json: string,
    track_selection: boolean
}

interface Props {
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
        this.state = { responses: [], analysisName: '', messageQueue: [], isSendingMessages: false, session_key: getRandomId()};
        this.processMessageQueueTimer = null; // Variable to store the timer

        // Set the session key so that the backend can identify this session, and create a unique
        // Mito backend for this session
        this.props.setProps({
            'session_key': this.state.session_key
        })
    }

    public getResponseData<ResultType>(messageID: string, maxRetries = MAX_RETRIES): Promise<SendFunctionReturnType<ResultType>> {

        return new Promise((resolve) => {
            let tries = 0;

            const interval = setInterval(() => {
                const unconsumedResponses = [...this.state.responses];
                // Only try at most MAX_RETRIES times
                tries++;

                if (tries > maxRetries) {
                    console.error(`No response on message: {id: ${messageID}}`);
                    clearInterval(interval);
                    // If we fail, we return an empty response
                    return resolve({
                        error: `No response on message: {id: ${messageID}}`,
                        errorShort: `No response received`,
                        showErrorModal: false
                    })
                }

                // See if there is an API response to this one specificially
                const index = unconsumedResponses.findIndex((response) =>  response['id'] === messageID)

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
            const [messageType, message] = this.state.messageQueue[0];

            this.props.setProps({
                [messageType]: message
            })

            // Remove the processed message from the queue - making sure
            // to avoid merge conflicts by finding by value
            this.setState((prevState) => {
                const messageQueue = [...prevState.messageQueue];
                const index = messageQueue.findIndex((m) => m[1] === message);
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
    
    handleMitoEvent = (propName: PropNameForSetProps, message: Record<string, unknown>) => {
        // TODO: I think we have to check the origin here, but I'm not sure
        // how to do that.

        // We don't send log events, we have a limited messaging budget for performance reasons
        // and because there is debouncing that cause messages to get lost. 
        if (message.event === 'log_event') {
            return
        }
    
        // Add the message to the queue
        this.setState((prevState) => ({
            messageQueue: [...prevState.messageQueue, [propName, message]],
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
        this.handleMitoEvent('message', msg);
        const response = await this.getResponseData(msg['id'] as string);        
        return response;
    }

    componentDidUpdate(prevProps: Props) {
        // When the component updates, we check for new responses. Notably, we do this here
        // rather than in the render function as the render function should be pure
        if (this.props.all_json !== prevProps.all_json) {
            this.processResponses();
        }
    }

    processResponses = () => {
        const { all_json } = this.props;
        const { responses_json } = JSON.parse(all_json);

        const responses = JSON.parse(responses_json);

        // Handling append-only responses
        if (responses.length > this.state.responses.length) {
            const newResponses = responses.slice(this.state.responses.length);
            this.setState(prevState => ({
                responses: [...prevState.responses, ...newResponses],
            }));
        }

        // Handling reset scenario
        if (responses.length < this.state.responses.length) {
            this.setState({ responses });
        }
    };


    render = () => {

        const {all_json} = this.props;
        const {sheet_data_json, analysis_data_json, user_profile_json, key, track_selection} = JSON.parse(all_json) as AllJson;

        const sheetDataArray = getSheetDataArrayFromString(sheet_data_json);
        const analysisData = getAnalysisDataFromString(analysis_data_json);
        const userProfile = getUserProfileFromString(user_profile_json);

        return (
            <Mito 
                key={key as string}
                getSendFunction={async () => this.send.bind(this)} 
                sheetDataArray={sheetDataArray} 
                analysisData={analysisData} 
                userProfile={userProfile}
                theme={analysisData.theme ?? undefined}
                onSelectionChange={track_selection ? (selectedDataframeIndex, selections) => {
                    this.handleMitoEvent('index_and_selections', {
                        selectedDataframeIndex, 
                        selections
                    });
                } : undefined}
            />  
        )
    }
}