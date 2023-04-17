

/**
  * Uses canvas.measureText to compute and return the width of the given text of given font in pixels.
  * 
  * @see https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
  */
export function getTextWidth(text: string, font: string): number {
    // re-use canvas object for better performance
    const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    const context = canvas.getContext("2d");
    if (!context) {
        throw new Error("Could not get context from canvas");
    }
    context.font = font;
    const metrics = context.measureText(text);
    return metrics.width;
}

// Allow us to save the canvas for performance reasons
// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace getTextWidth {
    export let canvas: HTMLCanvasElement | undefined;
}