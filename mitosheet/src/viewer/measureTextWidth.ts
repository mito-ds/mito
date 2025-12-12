/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Reusable canvas for text measurement to avoid creating new elements
let measurementCanvas: HTMLCanvasElement | null = null;
let measurementContext: CanvasRenderingContext2D | null = null;
let currentFont = "";

/**
 * Gets or creates a reusable canvas context for text measurement.
 * This avoids creating new canvas elements for each measurement.
 */
const getMeasurementContext = (): CanvasRenderingContext2D | null => {
    if (!measurementCanvas) {
        measurementCanvas = document.createElement("canvas");
        measurementContext = measurementCanvas.getContext("2d");
    }
    return measurementContext;
};

/**
 * Measures the width of text using a reusable canvas element.
 * This is more accurate than estimating based on character count.
 * Reuses a single canvas instance for performance.
 *
 * @param text - The text to measure
 * @param font - CSS font string (e.g., "13px system-ui")
 * @returns Width in pixels
 */
export const measureTextWidth = (text: string, font: string): number => {
    const context = getMeasurementContext();
    
    if (!context) {
        // Fallback: estimate width based on character count
        // Average character width is approximately 0.6 * font size
        const fontSize = parseInt(font.match(/\d+/)?.[0] || "13", 10);
        return text.length * fontSize * 0.6;
    }
    
    // Only set font if it changed (setting font is expensive)
    if (currentFont !== font) {
        context.font = font;
        currentFont = font;
    }
    
    return context.measureText(text).width;
};

/**
 * Gets the computed font style from an element or uses defaults.
 *
 * @param element - Optional element to get font from
 * @returns CSS font string
 */
export const getFontStyle = (element?: HTMLElement | null): string => {
    if (element) {
        const style = window.getComputedStyle(element);
        return `${style.fontSize} ${style.fontFamily}`;
    }
    
    // Default font style matching the viewer CSS
    return "13px system-ui, -apple-system, sans-serif";
};

/**
 * Gets the monospace font style (for numeric columns).
 *
 * @param element - Optional element to get font size from
 * @returns CSS font string with monospace font family
 */
export const getMonospaceFontStyle = (element?: HTMLElement | null): string => {
    let fontSize = "13px";
    if (element) {
        const style = window.getComputedStyle(element);
        fontSize = style.fontSize;
        // Try to get the code font family from CSS variable
        const codeFontFamily = style.getPropertyValue("--jp-code-font-family") || "monospace";
        return `${fontSize} ${codeFontFamily}`;
    }
    
    return `${fontSize} monospace`;
};

