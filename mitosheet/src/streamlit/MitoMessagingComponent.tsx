import {
    Streamlit,
    StreamlitComponentBase,
    withStreamlitConnection,
} from "streamlit-component-lib"
import React, { ReactNode } from "react"


/**
 * This is a React-based component template. The `render()` function is called
 * automatically when your component should be re-rendered.
 */
class MitoMessagingComponent extends StreamlitComponentBase {

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
        if (event.data.type === 'mito') { 
            Streamlit.setComponentValue(event.data.data);
        }
    };
}
  
export default withStreamlitConnection(MitoMessagingComponent);