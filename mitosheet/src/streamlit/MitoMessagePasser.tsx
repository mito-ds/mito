import React, { ReactNode } from "react";
import {
    Streamlit,
    StreamlitComponentBase,
    withStreamlitConnection
} from "streamlit-component-lib";


// TODO: This delay is off. We should ask how long this debounce is, and then
// set this to be a bit longer than that. TODO: as part of the beta, we need to figure
// this out. 
export const DELAY_BETWEEN_SET_COMPONENT_VALUES = 25;

/**
 * This component is used to pass messages from the Mito iframe to the running 
 * streamlit backend. 
 * 
 * The reason it exists:
 * - A streamlit component can only communicate with the backend with the setComponentValue
 *   function.
 * - When the setComponentValue function is called, the Python script re-runs from the top.
 * - This means that when we render the component in the Python script, we have not yet 
 *   received the data from the Mito iframe, as the component value is the return value
 *   of the Python component function. 
 * - To get around this, we use this component to listen for messages from the Mito iframe
 *   and then pass them to the Python script using the setComponentValue function.
 * - As this component is always rendered before the Mito iframe, we can be sure that
 *   the Python script will have received the message from the Mito iframe before it 
 *   renders the Mito iframe.
 * 
 * It's a bit of a hack, but it uses no undocumented APIs, and it works!
 * 
 * Notably, streamlit does so level of debouncing on setComponentValue updates, so we
 * have to provide some delay between them. Most of the work in this file is making sure
 * that we throttle the setComponentValue calls properly, without falling to any
 * race conditions.
 */
class MitoMessagePasser extends StreamlitComponentBase<{messageQueue: any[], isSendingMessages: boolean}> {
    processMessageQueueTimer: null | NodeJS.Timeout;
    
    constructor(props: any) {
        super(props);
        this.state = {
            messageQueue: [],
            isSendingMessages: false,
        };
        this.processMessageQueueTimer = null; // Variable to store the timer
    }


    public render = (): ReactNode => {
        return <div/>
    }

    componentDidMount() {
        window.addEventListener('message', this.handleMitoEvent);
    }

    componentWillUnmount() {
        window.removeEventListener('message', this.handleMitoEvent);
        if (this.processMessageQueueTimer) {
            clearTimeout(this.processMessageQueueTimer);
        }
    }
    
    processQueue = () => {
        if (this.state.messageQueue.length > 0) {
            // Send one message
            const message = this.state.messageQueue[0];
            Streamlit.setComponentValue(message);

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
            this.processMessageQueueTimer = setTimeout(this.processQueue, DELAY_BETWEEN_SET_COMPONENT_VALUES);
        } else {
            // Otherwise, we have processed the full queue
            this.setState({ isSendingMessages: false });
        }
    };
    
    handleMitoEvent = (event: MessageEvent) => {
        // TODO: I think we have to check the origin here, but I'm not sure
        // how to do that.

        if (event.data.type === 'mito') { 
            const message = event.data.data;
        
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
        }
    };
}
  
export default withStreamlitConnection(MitoMessagePasser);