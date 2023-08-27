import {
    Streamlit,
    StreamlitComponentBase,
    withStreamlitConnection
} from "streamlit-component-lib";


// TODO: This delay is off. We should ask how long this debounce is, and then
// set this to be a bit longer than that. TODO: as part of the beta, we need to figure
// this out. 
const DELAY_BETWEEN_SET_COMPONENT_VALUES = 25;

/**
 * 
 * Notably, streamlit does some level of debouncing on setComponentValue updates, so we
 * have to provide some delay between them. Most of the work in this file is making sure
 * that we throttle the setComponentValue calls properly, without falling to any
 * race conditions.
 * 
 * Any component can inherit from this class, and just call this.setComponentValue safely
 * without needing to worry about debouncing on it's own. All they need to do is to make 
 * sure to call super().componentWillUnmount
 */
class DebouncedStreamlitMessagePasser extends StreamlitComponentBase<{valueQueue: any[], isSendingMessages: boolean}> {
    processMessageQueueTimer: null | NodeJS.Timeout;
    
    constructor(props: any) {
        super(props);
        this.state = {
            valueQueue: [],
            isSendingMessages: false,
        };
        this.processMessageQueueTimer = null; // Variable to store the timer
    }

    componentWillUnmount() {
        if (this.processMessageQueueTimer) {
            clearTimeout(this.processMessageQueueTimer);
        }
    }
    
    processQueue = () => {
        if (this.state.valueQueue.length > 0) {
            // Send one message
            const value = this.state.valueQueue[0];
            Streamlit.setComponentValue(value);

            // Remove the processed message from the queue - making sure
            // to avoid race conditons by finding by value
            this.setState((prevState) => {
                const valueQueue = [...prevState.valueQueue];
                const index = valueQueue.findIndex((m) => m === value);
                valueQueue.splice(index, 1);

                return { 
                    valueQueue,
                    isSendingMessages: valueQueue.length > 0,
                };
            });

            // Set a timer to process the next message after a delay
            this.processMessageQueueTimer = setTimeout(this.processQueue, DELAY_BETWEEN_SET_COMPONENT_VALUES);
        } else {
            // Otherwise, we have processed the full queue
            this.setState({ isSendingMessages: false });
        }
    };
    
    setComponentValue = (value: any) => {
        // TODO: I think we have to check the origin here, but I'm not sure
        // how to do that.
        this.setState((prevState) => ({
            valueQueue: [...prevState.valueQueue, value],
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
}
  
export default withStreamlitConnection(DebouncedStreamlitMessagePasser);