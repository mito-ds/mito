/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import html2canvas from 'html2canvas';
import { isChromeBasedBrowser } from './user';

/**
 * Captures a DOM element as a PNG image with preserved styles.
 * 
 * This utility creates a high-fidelity screenshot of a DOM element by:
 * 1. Cloning the target element
 * 2. Preserving all computed styles with !important flags
 * 3. Capturing the clone using html2canvas
 * 4. Converting the result to a base64-encoded PNG
 * 
 * Note: This function is optimized for Chrome browsers and may be slow or 
 * unreliable in other browsers like Safari, so we skip the capture if the 
 * browser is not Chrome based.
 */
export const captureNode = async (node: HTMLElement): Promise<string | undefined> => {

    if (!isChromeBasedBrowser()) {
        console.log('Node capture skipped: This feature is optimized for Chrome browsers');
        return undefined;
    }
    
    try {
        if (!node) {
            throw new Error('No node provided');
        }

        // Create an off-screen wrapper to hold our clone
        const wrapper = createWrapper(node);
        
        // Create and prepare the clone
        const clone = node.cloneNode(true) as HTMLElement;
        preserveStyles(node, clone);
        
        // Position clone for capture
        wrapper.appendChild(clone);
        document.body.appendChild(wrapper);

        try {
            // Perform the capture
            const canvas = await html2canvas(clone, getHtml2CanvasOptions(node));
            return canvas.toDataURL('image/png').split(',')[1]
        } finally {
            // Clean up
            wrapper.parentNode?.removeChild(wrapper);
        }

    } catch (error) {
        console.error('Capture failed:', error);
        throw error;
    }
};

/**
 * Creates an off-screen wrapper element to contain the cloned node.
 * 
 * @param node - Reference node to size the wrapper
 * @returns HTMLDivElement - Configured wrapper element
 */
const createWrapper = (node: HTMLElement): HTMLDivElement => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: ${node.offsetWidth}px !important;
        height: ${node.offsetHeight}px !important;
        z-index: -9999 !important;
        background: transparent !important;
        pointer-events: none !important;
        opacity: 0 !important;
    `;
    return wrapper;
};

/**
 * Recursively copies all computed styles from a source element to a target element.
 * Adds !important to all styles to ensure they're preserved during capture.
 * 
 * @param sourceElement - Element to copy styles from
 * @param targetElement - Element to copy styles to
 */
const preserveStyles = (sourceElement: HTMLElement, targetElement: HTMLElement): void => {
    // Copy computed styles
    const computed = window.getComputedStyle(sourceElement);
    let stylesText = '';
    
    for (let i = 0; i < computed.length; i++) {
        const property = computed[i];

        if (property === undefined) {
            continue;
        }

        const value = computed.getPropertyValue(property);
        if (value) {
            stylesText += `${property}: ${value} !important; `;
        }
    }
    
    // Apply styles to target
    targetElement.style.cssText += stylesText;
    
    // Process children recursively
    Array.from(sourceElement.children).forEach((sourceChild, index) => {
        const targetChild = targetElement.children[index];
        if (sourceChild instanceof HTMLElement && targetChild instanceof HTMLElement) {
            preserveStyles(sourceChild, targetChild);
        }
    });
};

/**
 * Configures html2canvas options for optimal capture.
 * 
 * @param node - Reference node for dimensioning
 * @returns html2canvas configuration object
 */
// eslint-disable-next-line  @typescript-eslint/explicit-function-return-type
const getHtml2CanvasOptions = (node: HTMLElement) => ({
    scale: window.devicePixelRatio,
    useCORS: true,
    logging: false,
    allowTaint: true,
    backgroundColor: null,
    removeContainer: false,
    foreignObjectRendering: true,
    width: node.offsetWidth,
    height: node.offsetHeight,
    onclone: (document: Document) => {
        // Re-apply styles to cloned element
        const clonedElement = document.body.querySelector('*[data-html2canvas-clone="true"]');
        const originalElement = node.querySelector('*[data-html2canvas-clone="true"]');
        if (clonedElement instanceof HTMLElement && originalElement instanceof HTMLElement) {
            preserveStyles(originalElement, clonedElement);
        }
    }
});