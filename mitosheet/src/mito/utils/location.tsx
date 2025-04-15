/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */


/**
 * NOTE: This function key to the proper functioning of Mito in
 * Jupyter. As such, anytime we are in Jupyter, the isInJupyterLabOrNotebook
 * MUST return true. We check a variety of these conditions
 * to see if this works (including in cases when mito is remote). 
 * 
 * If you change this code, make sure to test it with remote servers that 
 * have non-standard URL schemes.
 */
export const isInJupyterLabOrNotebook = (): boolean => {
    return window.location.pathname.startsWith('/lab') ||
    window.location.pathname.startsWith('/notebooks') || 
    window.commands !== undefined ||
    (window as any)._JUPYTERLAB !== undefined
}


export const isInStreamlit = (): boolean => {
    
    // We are in streamlit if we are in an iframe that has a parent with
    // a class of "stApp"

    if (window.parent) {
        const parent = window.parent.document.querySelector('.stApp')
        if (parent) {
            return true
        }
    }
    return false
}

export const isInDash = (): boolean => {
    // Check if there is a div with the id _dash-app-content
    const dashAppContent = document.getElementById('_dash-app-content')
    if (dashAppContent) {
        return true
    }

    // Check for _dash-global-error-container
    const dashGlobalErrorContainer = document.getElementById('_dash-global-error-container')
    if (dashGlobalErrorContainer) {
        return true
    }

    return false;
}

export const isInDashboard = (): boolean => {
    return isInStreamlit() || isInDash()
}