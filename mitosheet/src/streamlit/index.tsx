import React from "react"
import ReactDOM from "react-dom"
import MyComponent from "./component"

export const isInStreamlit = (): boolean => {
  return true;
}

ReactDOM.render(
  <React.StrictMode>
    <MyComponent />
  </React.StrictMode>,
  document.getElementById("root")
)