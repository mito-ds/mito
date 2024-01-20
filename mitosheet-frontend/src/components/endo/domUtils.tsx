// Generic utilities for interacting with the dom


const checkElementIsVisible = (element: Element): boolean => {
    if (element === undefined) return false;

    const rect = element.getBoundingClientRect();

    // Adapted from: https://stackoverflow.com/questions/49751396/determine-if-element-is-behind-another
    // We give a 2 pixel error margin that can be hidden, because otherwise some windows
    // browsers (and sometimes mac browsers) don't get the node correctly
    const left = rect.left + 2
    const right = rect.right - 2
    const top = rect.top + 2
    const bottom = rect.bottom - 2

    const atTopleft = document.elementFromPoint(left, top) === element;
    const atTopRight = document.elementFromPoint(right, top) === element;
    const atBottomLeft = document.elementFromPoint(left, bottom) === element;
    const atBottomRight = document.elementFromPoint(right, bottom) === element;

    if (atTopleft && atTopRight && atBottomLeft && atBottomRight) {
        return true;
    }
    return false;
}

export const getChildrenWithQuery = (element: Element | null, querySelector: string): Element[] => {

    if (element === null) {
        return [];
    }

    const nodeList = element.querySelectorAll(querySelector);
    if (nodeList === undefined) {
        return [];
    }

    const children: Element[] = [];
    nodeList.forEach((node) => {
        children.push(node);
    });

    return children;
}


/* 
    This function returns true if there is a single descendant of the element
    div that matches the query selector and is _entirely_ visible - meaning no
    part of it is hidden behind scroll.
*/
export const isAnyElementWithSelectorEntirelyVisible = (element: HTMLElement, querySelector: string): boolean => {

    const nodeList = getChildrenWithQuery(element, querySelector)

    for (let i = 0; i < nodeList.length; i++) {
        const node = nodeList[i];
        if (checkElementIsVisible(node)) {
            return true;
        }
    }
    return false;
}