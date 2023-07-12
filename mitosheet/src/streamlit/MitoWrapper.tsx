import {
    StreamlitComponentBase,
    withStreamlitConnection,
} from "streamlit-component-lib"
import Mito from '../mito/Mito';
import React, { ReactNode } from "react"
import { SendFunction, SendFunctionError, SendFunctionError, SendFunctionReturnType } from "../mito";
import { getAnalysisDataFromString, getSheetDataArrayFromString, getUserProfileFromString } from "../jupyter/jupyterUtils";

interface State {
    responses: Record<string, unknown>[]
}


const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

/**
 * This is a React-based component template. The `render()` function is called
 * automatically when your component should be re-rendered.
 */
class MyComponent extends StreamlitComponentBase<State> {

    constructor(props: any) {
        super(props);
        this.state = { responses: [] };
    }

    public getResponseData<ResultType>(id: string, maxRetries = MAX_RETRIES): Promise<SendFunctionReturnType<ResultType>> {

        return new Promise((resolve) => {
            let tries = 0;

            const interval = setInterval(() => {
                const unconsumedResponses = [...this.state.responses];
                console.log("CHECKING FOR ", id, unconsumedResponses)
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
                console.log("FOUND", index)

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


    public render = (): ReactNode => {
        
        const sheetDataJSON = this.props.args['sheet_data_json'];
        const analysisDataJSON = this.props.args['analysis_data_json'];
        const userProfileJSON = this.props.args['user_profile_json'];
        const responsesJSON = this.props.args['responses_json'];
        const sheetDataArray = getSheetDataArrayFromString(sheetDataJSON);
        const analysisData = getAnalysisDataFromString(analysisDataJSON);
        const userProfile = getUserProfileFromString(userProfileJSON);

        const responses = JSON.parse(responsesJSON);
        // Check if the length of responsesJSON has increased
        if (responses.length > this.state.responses.length) {
            const newResponses = responses.slice(this.state.responses.length);
            
            // Add the new responses to the state
            this.setState(prevState => {
                console.log("UPDATING STATE", newResponses, prevState.responses)
                return {
                    responses: [...prevState.responses, ...newResponses]
                }
            });

        }

        // <ResultType>(msg: Record<string, unknown>) => Promise<SendFunctionReturnType<ResultType>> for streamlit
        const send = async (msg: Record<string, unknown>): Promise<SendFunctionReturnType<any>> => {
            // Get the parent window object
            const parentWindow = window.parent;

            // Get the list of iframes within the parent window
            const iframes = parentWindow.frames;

            // Find the index of the current iframe within the list
            const currentIndex = Array.from(iframes).findIndex(iframe => iframe === window);

            // Get the previous sibling iframe
            const previousSiblingIframe = iframes[currentIndex - 1];

            // Access the contents of the previous sibling iframe
            if (previousSiblingIframe) {
                console.log("SENDING", msg.id, msg.type)
                const previousSiblingWindow = previousSiblingIframe.window;
                previousSiblingWindow.postMessage({'type': 'mito', 'data': msg}, '*');
            }
            
            // Then we set it again with something silly, to get new responses
            return await this.getResponseData(msg['id'] as string);
        }

        return (
            <Mito 
                getSendFunction={async (): Promise<SendFunction | SendFunctionError> => {
                    return send as SendFunction;
                }} 
                sheetDataArray={sheetDataArray} 
                analysisData={analysisData} 
                userProfile={userProfile}
            />  
        )
    }


    onMessageFromBackend(msg: Record<string, unknown>): void {
        console.log(msg);
    }

    /** Click handler for our "Click Me!" button. 
    private onClicked = (): void => {
        // Increment state.numClicks, and pass the new value back to
        // Streamlit via `Streamlit.setComponentValue`.
        this.setState(
        prevState => ({ numClicks: prevState.numClicks + 1 }),
        () => Streamlit.setComponentValue(this.state.numClicks)
        )
    }

    private _onFocus = (): void => {
        this.setState({ isFocused: true })
    }

    private _onBlur = (): void => {
        this.setState({ isFocused: false })
    }

    */

}

// "withStreamlitConnection" is a wrapper function. It bootstraps the
// connection between your component and the Streamlit app, and handles
// passing arguments from Python -> Component.
//
// You don't need to edit withStreamlitConnection (but you're welcome to!).
export default withStreamlitConnection(MyComponent)  