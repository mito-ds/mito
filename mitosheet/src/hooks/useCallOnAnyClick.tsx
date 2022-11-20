import { useEffect } from "react";


export const clickedOnClass = (targetNode: EventTarget | null | undefined, className: string | undefined): boolean => {
    if (targetNode !== null && targetNode instanceof Node && targetNode.nodeType === Node.ELEMENT_NODE && className !== undefined) {
        let currentElement = targetNode as (HTMLElement | null);

        // First check all of the parent elements
        while (currentElement) {
            if (currentElement.classList.contains(className)) {
                return true;
            }
            currentElement = currentElement.parentElement;
        }
    }
    return false;
}

/*
    This hook detects when the user makes any click, and then calls the passed function.

    If the clicked on element is a child of an element with the noActionClassName applied
    to it, then the onClick will not be called. 

    Adapted from https://stackoverflow.com/questions/54560790/detect-click-outside-react-component-using-hooks
*/
export function useCallOnAnyClick(onClick: (targetNode: EventTarget | null | undefined) => void, noActionClassName?: string): void {

    const handleClick = (event: MouseEvent) => { 
        const targetNode = event.target;

        // We return early if the clicked element is a child of something with the dropdown closed class
        if (clickedOnClass(targetNode, noActionClassName)) {
            return;
        }
        
        /* 
            We delay actually calling of the function by 100 miliseconds, just in case the user's click is 
            actually on the dropdown open/close button. This makes sure that we don't close and then 
            immediately reopen the component.

            It is an ugly hack, but it appears to work for now!
        */
        setTimeout(() => {
            onClick(targetNode);
        }, 100)
    };

    useEffect(() => {
        document.addEventListener('click', handleClick, true);
        return () => {
            document.removeEventListener('click', handleClick, true);
        };
    });
}