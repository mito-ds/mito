import React, { ReactNode } from "react";
import {
    Streamlit,
    StreamlitComponentBase,
    withStreamlitConnection
} from "streamlit-component-lib";


const DELAY = 25;

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
 */
class MitoMessagePasser extends StreamlitComponentBase<{messageQueue: any[], isSending: boolean}> {
    timer: null | NodeJS.Timeout;
    
    constructor(props: any) {
        super(props);
        this.state = {
          messageQueue: [],
          isSending: false,
        };
        this.timer = null; // Variable to store the timer
    }
    
    processQueue = () => {
        if (this.state.messageQueue.length > 0) {
            const message = this.state.messageQueue[0];
            // Code to send the message
            console.log('Sending message:', message);
            Streamlit.setComponentValue(message);

            // Remove the processed message from the queue
            this.setState((prevState) => ({
                messageQueue: prevState.messageQueue.slice(1),
                isSending: true,
            }));

            // Set a timer to process the next message after a delay
            this.timer = setTimeout(this.processQueue, DELAY);
        } else {
            this.setState({ isSending: false });
        }
    };
    

    public render = (): ReactNode => {
        return <div/>
    }

    componentDidMount() {
        window.addEventListener('message', this.handleMitoEvent);
    }

    componentWillUnmount() {
        window.removeEventListener('message', this.handleMitoEvent);
        if (this.timer) {
            clearTimeout(this.timer);
        }
    }


    handleMitoEvent = (event: MessageEvent) => {
        // TODO: I think we have to check the origin here, but I'm not sure
        // how to do that.

        if (event.data.type === 'mito') { 
            // We don't send log events, we have a limited messaging budget for performance reasons
            // and because there is debouncing that cause messages to get lost. 
            if (event.data.data.event === 'log_event') {
                return
            }

            const message = event.data.data;
        
            // Add the message to the queue
            this.setState((prevState) => ({
                messageQueue: [...prevState.messageQueue, message],
            }));
        
            // Do some work to make sure we avoid race conditions
            let processQueue = false;
            this.setState(prevState => {
                if (!prevState.isSending) {
                    processQueue = true;
                }
                return { isSending: true };
            }, () => {
                if (processQueue) {
                    this.processQueue();
                }
            });
        }
    };
}
  
export default withStreamlitConnection(MitoMessagePasser);