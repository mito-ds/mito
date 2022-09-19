import {
  Streamlit,
  StreamlitComponentBase,
  withStreamlitConnection,
} from "streamlit-component-lib"
import React, { ReactNode } from "react"
import Mito from "./mito/components/Mito"
import { DataTypeInMito } from "./mito/types"
import MitoAPI from "./mito/jupyter/api"
import { StepType } from "./mito/types"

interface State {
  numClicks: number
  isFocused: boolean
}

/**
 * This is a React-based component template. The `render()` function is called
 * automatically when your component should be re-rendered.
 */
class MyComponent extends StreamlitComponentBase<State> {
  public state = { numClicks: 0, isFocused: false }

  public render = (): ReactNode => {

    // Streamlit sends us a theme object via props that we can use to ensure
    // that our component has visuals that match the active theme in a
    // streamlit app.
    const { theme } = this.props
    const style: React.CSSProperties = {}

    // Maintain compatibility with older versions of Streamlit that don't send
    // a theme object.
    if (theme) {
      // Use the theme object to style our button border. Alternatively, the
      // theme style is defined in CSS vars.
      const borderStyling = `1px solid ${
        this.state.isFocused ? theme.primaryColor : "gray"
      }`
      style.border = borderStyling
      style.outline = borderStyling
    }

    // Show a button and some text.
    // When the button is clicked, we'll increment our "numClicks" state
    // variable, and send its new value back to Streamlit, where it'll
    // be available to the Python program.
    const mitoAPI = new MitoAPI('123', this.send, () => {}, (e) => {});


    return (
      <Mito 
        model_id={"123"} 
        mitoAPI={mitoAPI} 
        sheetDataArray={JSON.parse(this.props.args['sheet_data_json'])} 
        analysisData={JSON.parse(this.props.args['analysis_data_json'])} 
        userProfile={JSON.parse(this.props.args['user_profile_json'])}      
      />
    )
  }

  /** Click handler for our "Click Me!" button. */
  private send = (msg: Record<string, unknown>): void => {
    console.log(msg);
    Streamlit.setComponentValue(JSON.stringify(msg))
  }

}

// "withStreamlitConnection" is a wrapper function. It bootstraps the
// connection between your component and the Streamlit app, and handles
// passing arguments from Python -> Component.
//
// You don't need to edit withStreamlitConnection (but you're welcome to!).
export default withStreamlitConnection(MyComponent)
