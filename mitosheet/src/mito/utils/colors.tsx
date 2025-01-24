import { MitoTheme } from "../types"

type HSLColor = {
    h: number;
    s: number;
    l: number;
};

type RGBColor = {
    r: number;
    g: number;
    b: number;
};

const HIGHLIGHT_VARIABLE_NAME = '--mito-highlight';
const HIGHLIGHT_MEDIUM_VARIABLE_NAME = '--mito-highlight-medium';
const HIGHLIGHT_LIGHT_VARIABLE_NAME = '--mito-highlight-light';
const HIGHLIGHT_VERY_LIGHT_VARIABLE_NAME = '--mito-highlight-very-light';

const DEFAULT_HIGHLIGHT = 'var(--mito-purple)';
const DEFAULT_HIGHLIGHT_MEDIUM = 'var(--mito-medium-purple)';
const DEFAULT_HIGHLIGHT_LIGHT = 'var(--mito-light-purple)';
const DEFAULT_HIGHLIGHT_VERY_LIGHT = 'var(--mito-very-light-purple)';

const TEXT_VARIABLE_NAME = '--mito-text';
const TEXT_MEDIUM_VARIABLE_NAME = '--mito-text-medium';
const TEXT_LIGHT_VARIABLE_NAME = '--mito-text-light';
const DEFAULT_TEXT = 'var(--jp-content-font-color1)';
const DEFAULT_TEXT_MEDIUM = 'var(--mito-medium-gray)';
const DEFAULT_TEXT_LIGHT = 'var(--mito-light-gray)';

const BACKGROUND_VARIABLE_NAME = '--mito-background';
const BACKGROUND_OFF_VARIABLE_NAME = '--mito-background-off';
const BACKGROUND_HIGHLIGHT_VARIABLE_NAME = '--mito-background-highlight';
const TOOLBAR_HOVER_VARIABLE_NAME = '--mito-toolbar-hover';
const DEFAULT_BACKGROUND = 'var(--jp-layout-color1)';
const DEFAULT_BACKGROUND_OFF = 'var(--jp-layout-color2)';
const DEFAULT_BACKGROUND_HIGHLIGHT = 'var(--jp-input-background)';
const TOOLBAR_HOVER_BACKGROUND = 'var(--mito-pretty-light-gray)';

const getHighlightTheme = (primaryColor: string | undefined): React.CSSProperties => {
    if (primaryColor === undefined) {
        return {
            [HIGHLIGHT_VARIABLE_NAME]: DEFAULT_HIGHLIGHT,
            [HIGHLIGHT_MEDIUM_VARIABLE_NAME]: DEFAULT_HIGHLIGHT_MEDIUM,
            [HIGHLIGHT_LIGHT_VARIABLE_NAME]: DEFAULT_HIGHLIGHT_LIGHT,
            [HIGHLIGHT_VERY_LIGHT_VARIABLE_NAME]: DEFAULT_HIGHLIGHT_VERY_LIGHT,
        } as React.CSSProperties
    }

    const primaryColorHex = convertToHex(primaryColor);
    return {
        [HIGHLIGHT_VARIABLE_NAME]: hexToRGBString(primaryColorHex, 1),
        [HIGHLIGHT_MEDIUM_VARIABLE_NAME]: hexToRGBString(primaryColorHex, .8),
        [HIGHLIGHT_LIGHT_VARIABLE_NAME]: hexToRGBString(primaryColorHex, .6),
        [HIGHLIGHT_VERY_LIGHT_VARIABLE_NAME]: hexToRGBString(primaryColorHex, .4),
    } as React.CSSProperties
}

const getTextColors = (textColor: string | undefined): React.CSSProperties => {
    if (textColor === undefined) {
        return {
            [TEXT_VARIABLE_NAME]: DEFAULT_TEXT,
            [TEXT_MEDIUM_VARIABLE_NAME]: DEFAULT_TEXT_MEDIUM,
            [TEXT_LIGHT_VARIABLE_NAME]: DEFAULT_TEXT_LIGHT,
        } as React.CSSProperties
    }

    const textColorHex = convertToHex(textColor);
    return {
        [TEXT_VARIABLE_NAME]: hexToRGBString(textColorHex, 1),
        [TEXT_MEDIUM_VARIABLE_NAME]: hexToRGBString(textColorHex, .8),
        [TEXT_LIGHT_VARIABLE_NAME]: hexToRGBString(textColorHex, .6),
    } as React.CSSProperties
}

const getBackgroundColors = (backgroundColor: string | undefined): React.CSSProperties => {
    if (backgroundColor === undefined) {
        return {
            [BACKGROUND_VARIABLE_NAME]: DEFAULT_BACKGROUND,
            [BACKGROUND_OFF_VARIABLE_NAME]: DEFAULT_BACKGROUND_OFF,
            [BACKGROUND_HIGHLIGHT_VARIABLE_NAME]: DEFAULT_BACKGROUND_HIGHLIGHT,
            [TOOLBAR_HOVER_VARIABLE_NAME]: TOOLBAR_HOVER_BACKGROUND,
        } as React.CSSProperties
    }

    const backgroundColorHex = convertToHex(backgroundColor);

    const {offBackground, highlightBackground} = generateOffAndHighlightBackground(backgroundColorHex);
    return {
        [BACKGROUND_VARIABLE_NAME]: hexToRGBString(backgroundColorHex, 1),
        [BACKGROUND_OFF_VARIABLE_NAME]: offBackground,
        [BACKGROUND_HIGHLIGHT_VARIABLE_NAME]: highlightBackground,
        [TOOLBAR_HOVER_VARIABLE_NAME]: hexToRGBString(backgroundColorHex, .8),
    } as React.CSSProperties
}



export const getCSSStyleVariables = (height: string | undefined, theme?: MitoTheme): React.CSSProperties => {

    const highlightTheme = getHighlightTheme(theme?.primaryColor);
    const textTheme = getTextColors(theme?.textColor);
    const backgroundTheme = getBackgroundColors(theme?.backgroundColor);
    const heightTheme = height ? {'--mito-height': height} : {'--mito-height': '538px'} as React.CSSProperties;


    return {
        ...highlightTheme,
        ...textTheme,
        ...backgroundTheme,
        ...heightTheme,
    }
}


/* 
    Given a hex color value, returs the same color in rgb format with an optional opacity applied. 
    Code from: https://stackoverflow.com/questions/21646738/convert-hex-to-rgba
*/ 
export const hexToRGBString = (hex: string | null, alpha: number | undefined): string | undefined => {
    if (hex === null) {
        return undefined
    }
    
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)

    if (alpha) {
        return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
    } else {
        return "rgb(" + r + ", " + g + ", " + b + ")";
    }
}

/**
 * Converts any color to hex format.
 * @param color - can be white, #fffff or var(--mito-color-variable-name)
 * @param parentDiv - to resolve variable names, we allow you to pass a parent div to resolve in the context of
 * @returns 
 */
export function convertToHex(color: string, parentDiv?: HTMLDivElement | null): string {
    // If the color is already in hex format, return it as is
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(color)) {
        return color;
    }
    
    // If the color is in rgb format, convert it to hex
    if (/^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/.test(color)) {
        const rgbValues = color.match(/\d+/g);
        const hexValues = rgbValues?.map(value => {
            const hex = Number(value).toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        });
        if (hexValues) {
            return "#" + hexValues.join("");
        }
    }
    
    // If the color is a named color, create a temporary element to get the computed color
    
    const tempElement = document.createElement("div");
    tempElement.style.color = color;

    if (parentDiv) {
        parentDiv.appendChild(tempElement);
    } else {
        document.body.appendChild(tempElement);
    }

    const computedColor = getComputedStyle(tempElement).color;
    document.body.removeChild(tempElement);
    
    // Recursively call the function with the computed color value
    return convertToHex(computedColor);
}

function generateOffAndHighlightBackground(hexColor: string): {offBackground: string, highlightBackground: string} {
    // Convert the hex color to RGB
    const rgbColor = hexToRgb(hexColor);
  
    // Calculate the brightness of the color
    const brightness = calculateBrightness(rgbColor);
  
    // Define the threshold for determining light or dark background
    const threshold = 128;
  
    // Generate the background color
    let backgroundColor;
    if (brightness < threshold) {
        // Dark background, make it slightly lighter
        backgroundColor = lightenColor(rgbColor, 10);
    } else {
        // Light background, make it slightly darker
        backgroundColor = darkenColor(rgbColor, 10);
    }
  
    // Generate the highlight color
    let highlightColor;
    if (brightness < threshold) {
        // Dark background, make the highlight color lighter
        highlightColor = lightenColor(rgbColor, 20);
    } else {
        // Light background, make the highlight color darker
        highlightColor = darkenColor(rgbColor, 20);
    }
  
    return {
        offBackground: rgbToHex(backgroundColor),
        highlightBackground: rgbToHex(highlightColor)
    };
}
  
// Helper function to convert hex color to RGB
function hexToRgb(hexColor: string): RGBColor {
    const hex = hexColor.replace("#", "");
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r: r, g: g, b: b };
}
  
// Helper function to convert RGB color to hex
function rgbToHex(rgbColor: RGBColor): string {
    const hexR = rgbColor.r.toString(16).padStart(2, "0");
    const hexG = rgbColor.g.toString(16).padStart(2, "0");
    const hexB = rgbColor.b.toString(16).padStart(2, "0");
    return "#" + hexR + hexG + hexB;
}
  
// Helper function to calculate the brightness of a color
// https://stackoverflow.com/questions/596216/formula-to-determine-perceived-brightness-of-rgb-color
function calculateBrightness(rgbColor: RGBColor): number {
    return (rgbColor.r * 299 + rgbColor.g * 587 + rgbColor.b * 114) / 1000;
}
  
// Helper function to lighten a color
function lightenColor(rgbColor: RGBColor, amount: number): RGBColor {
    const hslColor = rgbToHsl(rgbColor);
    hslColor.l += amount / 100;
    hslColor.l = Math.min(Math.max(hslColor.l, 0), 1);
    return hslToRgb(hslColor);
}
  
// Helper function to darken a color
function darkenColor(rgbColor: RGBColor, amount: number): RGBColor {
    const hslColor = rgbToHsl(rgbColor);
    hslColor.l -= amount / 100;
    hslColor.l = Math.min(Math.max(hslColor.l, 0), 1);
    return hslToRgb(hslColor);
}
  
// Helper function to convert RGB color to HSL
function rgbToHsl(rgbColor: RGBColor): HSLColor {
    const r = rgbColor.r / 255;
    const g = rgbColor.g / 255;
    const b = rgbColor.b / 255;
  
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s;
  
    const l = (max + min) / 2;
  
    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
      
        if (h !== undefined) {
            h /= 6;
        }
    }
  
    return { h: h, s: s, l: l } as HSLColor;
}


  
// Helper function to convert HSL color to RGB
function hslToRgb(hslColor: HSLColor): RGBColor  {
    const h = hslColor.h;
    const s = hslColor.s;
    const l = hslColor.l;
  
    let r, g, b;
  
    if (s === 0) {
        r = g = b = l;
    } else {
        const hueToRgb = function hueToRgb(p: number, q: number, t: number) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
  
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
  
        r = hueToRgb(p, q, h + 1 / 3);
        g = hueToRgb(p, q, h);
        b = hueToRgb(p, q, h - 1 / 3);
    }
  
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}