// Makes sure plotly is available anywhere in the window
const loadPlotly = (): void => {
    // We load the plotly js scripts if they have not
    // already been loaded
    if (!('Plotly' in window)) {
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://cdn.plot.ly/plotly-latest.min.js';
        document.head.appendChild(script);
    }
   
}

export default loadPlotly;

