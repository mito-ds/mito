import { isInJupyterLab } from "../jupyter/jupyterUtils";

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
 * Note that 
 * 
 * 
 */
const loadPlotly = (): void => {
    if (!('Plotly' in window)) {
        if (isInJupyterLab()) {
            const script = document.createElement('script');
            script.async = true;
            script.src = 'https://cdn.plot.ly/plotly-latest.min.js';

            document.head.appendChild(script);
        } else {
            // TODO: in the future, we should just check if we're an AMD context, which
            // I am sure there is easy code for
            (window as any).requirejs(['https://cdn.plot.ly/plotly-latest.min.js'],
                function   (p: any) {
                    (window as any).Plotly = p
            });
        }

        
    }
   
}

export default loadPlotly;

