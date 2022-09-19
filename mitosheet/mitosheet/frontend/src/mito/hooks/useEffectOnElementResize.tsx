import { useEffect } from "react";

/* 
    An effect that runs whenever the element with the passed
    id is resized.
    
    Notably, the resize event is only triggered on the window, 
    so we cannot just add a resize event lister. 
    See here: https://developer.mozilla.org/en-US/docs/Web/API/Window/resize_event

    Thus, we use a resize observer to watch for resizes
    See here: https://developer.mozilla.org/en-US/docs/Web/API/Resize_Observer_API
*/
export const useEffectOnResizeElement = (effect: () => void, deps: unknown[], id: string): void => {
    useEffect(() => {
        const resizeObserver = new ResizeObserver(() => {
            effect();
        })

        const element = document.getElementById(id);

        if (element) {
            resizeObserver.observe(element);
        }
        
        return () => {
            resizeObserver.disconnect();
        }
    }, [...deps, id])
}