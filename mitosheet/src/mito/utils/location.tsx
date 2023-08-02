
/**
 * NOTE: the next two functions are key to the proper functioning of Mito in
 * these two environments. As such, anytime we are in JupyterLab, the 
 * isInJupyterLab MUST return true. We check a variety of these conditions
 * to see if this works (including in cases when mito is remote). 
 * 
 * If you change this code, make sure to test it with remove servers that 
 * have non-standard URL schemes.
 */

export const isInJupyterLab = (): boolean => {
    return window.location.pathname.startsWith('/lab') ||
        window.commands !== undefined ||
        (window as any)._JUPYTERLAB !== undefined
}
export const isInJupyterNotebook = (): boolean => {
    return window.location.pathname.startsWith('/notebooks') ||
        (window as any).Jupyter !== undefined
}

export const isInStreamlit = (): boolean => {
    // Check if we are in an iframe, and if we are, look for an stApp that we are a part of
    let currentWindow: Window | null = window;
    if (currentWindow !== window.top) {        
        if (currentWindow.document?.getElementsByClassName('stApp').length > 0) {
            return true;
        }
        currentWindow = window.parent;
    }
    return false;
}