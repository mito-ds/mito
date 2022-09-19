
const loadPlotlyWithScriptElement = () => {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://cdn.plot.ly/plotly-latest.min.js';
    document.head.appendChild(script);
}

const loadPlotlyWithRequireJS = () => {
    const requirejs = (window as any).requirejs;
    if (requirejs) {
        requirejs(['https://cdn.plot.ly/plotly-latest.min.js'],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            function   (p: any) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (window as any).Plotly = p
            });
    }
}

/**
 * This is the function that makes sure that Plotly is loaded in a global
 * scope. It takes a bit of a complicated approach to get here. 
 * 
 * If we're in JupyterLab, we can just execute the script that loads the Plotly
 * minified code. This is pretty easy. 
 * 
 * If, on the other hand, we're in a Jupyter Notebook, we need to do something a 
 * little different. 
 * 
 * Namely, JNotebooks Extensions are AMD modules, which means that loading scripts
 * in the standard way does not work - and if you try and use a script you'll get
 * a variety of very confusing errors. 
 * 
 * Thus, we need to take an approach that involves using requirejs, which comes
 * in the AMD context anyways. 
 * 
 */
const loadPlotly = (): void => {
    if (!('Plotly' in window)) {
        const requirejs = (window as any).requirejs;
        if (requirejs) {
            // if there is any requirejs, we load using it
            loadPlotlyWithRequireJS();
        } else {
            // otherwise, we load using a script element
            loadPlotlyWithScriptElement();
        }    
    }
}

export default loadPlotly;

