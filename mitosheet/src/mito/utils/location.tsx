
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

// TODO: We need to support detecting dash, and then we need to disable importing when you're on dash