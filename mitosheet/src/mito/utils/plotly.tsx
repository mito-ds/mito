/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */


let plotlyLoadPromise: Promise<void> | undefined;

const loadBundledPlotly = (): void => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const plotlyModule = require('plotly.js-dist-min');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Plotly = plotlyModule?.default ?? plotlyModule;
};

/**
 * Load Plotly into `window.Plotly` from the local bundle so graph rendering does
 * not depend on network access in notebook environments.
 */
const loadPlotly = (): Promise<void> => {
    if ((window as any).Plotly) {
        return Promise.resolve();
    }

    if (plotlyLoadPromise === undefined) {
        plotlyLoadPromise = Promise.resolve().then(() => {
            loadBundledPlotly();
        });
    }

    return plotlyLoadPromise;
};

export default loadPlotly;

