import React from 'react';
import './App.css';
import MitoFlask from './MitoFlask';

function App() {

  const [numMitoFlasks, setNumMitoFlasks] = React.useState(1);

  return (
    <div className="App">
      <h1>Mito in Flask Starter App</h1>
      <div>
        This is a basic react app that uses the MitoFlask component to create a spreadsheet.
        This app is then rendered by a Flask server, that handles the processing of edits
        by the spreadsheet.
      </div>
      {Array.from(Array(numMitoFlasks).keys()).map((i) => (
        <div key={i} style={{maxWidth: '80%', margin: 'auto', marginTop: '25px'}}>
          <MitoFlask
            mitoFlaskRoute='/api/mito/process'
          />
        </div>
        ))}
      {<button onClick={() => setNumMitoFlasks(numMitoFlasks + 1)}>Add Another Mito</button>}
    </div>
  );
}

export default App;
