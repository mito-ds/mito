import {
    Streamlit,
    StreamlitComponentBase,
    withStreamlitConnection,
} from "streamlit-component-lib"
import React, { ReactNode } from "react"


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
class MitoMessagePasser extends StreamlitComponentBase {

    public render = (): ReactNode => {
        return <div/>
    }

    componentDidMount() {
        window.addEventListener('message', this.handleMitoEvent);
    }

    componentWillUnmount() {
        window.removeEventListener('message', this.handleMitoEvent);
    }

    handleMitoEvent = (event: MessageEvent) => {
        // TODO: I think we have to check the origin here, but I'm not sure
        // how to do that.

        if (event.data.type === 'mito') { 
            Streamlit.setComponentValue(event.data.data);
        }
    };
}
  
export default withStreamlitConnection(MitoMessagePasser);