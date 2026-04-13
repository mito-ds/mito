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

/**
 * VS Code / Cursor run `mitosheet.sheet()` via the HTTP-based frontend (see mito_backend.is_in_vs_code).
 * That output runs in a notebook webview, not under /lab or /notebooks, and `window.commands` is unset.
 */
export const isInVsCodeNotebookOutput = (): boolean => {
    if (typeof window === 'undefined') {
        return false
    }
    if (window.location.protocol === 'vscode-webview:') {
        return true
    }
    try {
        if (typeof (globalThis as unknown as { acquireVsCodeApi?: () => unknown }).acquireVsCodeApi === 'function') {
            return true
        }
    } catch {
        // Cross-origin parent access can throw; ignore.
    }
    return false
}

/**
 * Set in HTML by Python when embedding Mito in notebook output (Jupyter comm + VS Code paths).
 * Cursor’s notebook iframe often does not match vscode-webview / acquireVsCodeApi checks.
 */
export const isMitoNotebookOutputEmbed = (): boolean => {
    if (typeof window === 'undefined') {
        return false
    }
    try {
        return (window as unknown as { __MITO_NOTEBOOK_OUTPUT__?: boolean }).__MITO_NOTEBOOK_OUTPUT__ === true
    } catch {
        return false
    }
}

/** Streamlit / notebook: show AI notes toolbar and taskpane. */
export const isStreamlitAiNotesEnabled = (): boolean => {
    return isInStreamlit() || isInJupyterLabOrNotebook() || isInVsCodeNotebookOutput() || isMitoNotebookOutputEmbed()
}