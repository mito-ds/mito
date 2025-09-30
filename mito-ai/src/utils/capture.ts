/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

/**
 * Capture a DOM element as a PNG screenshot using canvas
 * 
 * This uses the SVG foreignObject technique which is faster than html2canvas:
 * 1. Serialize the target DOM element to HTML string
 * 2. Embed in SVG foreignObject
 * 3. Convert SVG to blob URL
 * 4. Load as image and draw to canvas
 * 5. Extract as data URL
 * 
 * @param element - The DOM element to capture
 * @param selection - Optional rectangular region to capture {x, y, width, height}
 * @returns Promise resolving to data URL (base64 PNG)
 */
export async function captureElement(
  element: HTMLElement,
  selection?: { x: number; y: number; width: number; height: number }
): Promise<string> {
  const startTime = performance.now();
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot get canvas context');

  // Determine dimensions
  const fullWidth = element.offsetWidth;
  const fullHeight = element.offsetHeight;
  const captureWidth = selection?.width || fullWidth;
  const captureHeight = selection?.height || fullHeight;

  canvas.width = captureWidth;
  canvas.height = captureHeight;

  // Get all computed styles for the element and its children
  const clonedElement = element.cloneNode(true) as HTMLElement;
  await inlineStyles(element, clonedElement);

  // Serialize DOM to SVG
  const svgData = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${fullWidth}" height="${fullHeight}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml">
          ${clonedElement.outerHTML}
        </div>
      </foreignObject>
    </svg>
  `;

  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();

  return new Promise((resolve, reject) => {
    img.onload = () => {
      try {
        // Draw full image or cropped region
        if (selection) {
          ctx.drawImage(
            img,
            selection.x, selection.y, selection.width, selection.height,
            0, 0, selection.width, selection.height
          );
        } else {
          ctx.drawImage(img, 0, 0);
        }
        
        URL.revokeObjectURL(url);
        
        const dataUrl = canvas.toDataURL('image/png');
        const endTime = performance.now();
        const duration = endTime - startTime;
        const sizeKB = Math.round((dataUrl.length * 0.75) / 1024); // Approximate size in KB
        
        console.log(`[Canvas Screenshot] Capture completed in ${duration.toFixed(2)}ms, Size: ${sizeKB}KB`);
        
        resolve(dataUrl);
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };
    
    img.onerror = (error) => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image from SVG'));
    };
    
    img.src = url;
  });
}

/**
 * Inline all computed styles into the cloned element
 * This ensures styles are preserved when converting to SVG
 */
async function inlineStyles(source: HTMLElement, target: HTMLElement): Promise<void> {
  const sourceStyle = window.getComputedStyle(source);
  let cssText = '';
  
  for (let i = 0; i < sourceStyle.length; i++) {
    const property = sourceStyle[i];
    if (property) {
      const value = sourceStyle.getPropertyValue(property);
      if (value) {
        cssText += `${property}: ${value}; `;
      }
    }
  }
  
  target.style.cssText = cssText;
  
  // Recursively process children
  const sourceChildren = Array.from(source.children);
  const targetChildren = Array.from(target.children);
  
  for (let i = 0; i < sourceChildren.length; i++) {
    const sourceChild = sourceChildren[i];
    const targetChild = targetChildren[i];
    
    if (sourceChild instanceof HTMLElement && targetChild instanceof HTMLElement) {
      await inlineStyles(sourceChild, targetChild);
    }
  }
}

/**
 * Captures a notebook cell output with performance metrics
 * 
 * @param cellElement - The notebook cell element to capture
 * @returns Promise with the data URL and performance metrics
 */
export async function captureCellWithMetrics(
  cellElement: HTMLElement
): Promise<{ dataUrl: string; duration: number; sizeKB: number }> {
  const startTime = performance.now();
  const dataUrl = await captureElement(cellElement);
  const endTime = performance.now();
  
  const duration = endTime - startTime;
  const sizeKB = Math.round((dataUrl.length * 0.75) / 1024);
  
  return { dataUrl, duration, sizeKB };
}

/**
 * Test function to capture a cell and log metrics
 * Usage: Call this from the browser console with a cell element
 */
export async function testCapture(selector: string): Promise<void> {
  const element = document.querySelector(selector) as HTMLElement;
  
  if (!element) {
    console.error(`Element not found: ${selector}`);
    return;
  }
  
  console.log('[Canvas Screenshot Test] Starting capture...');
  console.log(`[Canvas Screenshot Test] Element dimensions: ${element.offsetWidth}x${element.offsetHeight}px`);
  
  try {
    const { dataUrl, duration, sizeKB } = await captureCellWithMetrics(element);
    
    console.log('[Canvas Screenshot Test] ✓ SUCCESS');
    console.log(`[Canvas Screenshot Test] Duration: ${duration.toFixed(2)}ms`);
    console.log(`[Canvas Screenshot Test] Size: ${sizeKB}KB`);
    console.log(`[Canvas Screenshot Test] Performance: ${duration < 500 ? '✓ PASS (<500ms)' : '✗ FAIL (>500ms)'}`);
    console.log('[Canvas Screenshot Test] Data URL (first 100 chars):', dataUrl.substring(0, 100));
    
    // Create a download link for testing
    const link = document.createElement('a');
    link.download = `screenshot-${Date.now()}.png`;
    link.href = dataUrl;
    link.textContent = 'Download Screenshot';
    link.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 10000; padding: 10px; background: #007bff; color: white; border-radius: 5px; text-decoration: none; font-family: sans-serif;';
    document.body.appendChild(link);
    
    setTimeout(() => link.remove(), 10000);
    
  } catch (error) {
    console.error('[Canvas Screenshot Test] ✗ FAILED:', error);
  }
}

/**
 * Test function to capture with a rectangular selection
 */
export async function testCaptureWithSelection(
  selector: string,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<void> {
  const element = document.querySelector(selector) as HTMLElement;
  
  if (!element) {
    console.error(`Element not found: ${selector}`);
    return;
  }
  
  console.log('[Canvas Screenshot Test] Starting capture with selection...');
  console.log(`[Canvas Screenshot Test] Selection: x=${x}, y=${y}, w=${width}, h=${height}`);
  
  const startTime = performance.now();
  
  try {
    const dataUrl = await captureElement(element, { x, y, width, height });
    const duration = performance.now() - startTime;
    const sizeKB = Math.round((dataUrl.length * 0.75) / 1024);
    
    console.log('[Canvas Screenshot Test] ✓ SUCCESS (with selection)');
    console.log(`[Canvas Screenshot Test] Duration: ${duration.toFixed(2)}ms`);
    console.log(`[Canvas Screenshot Test] Size: ${sizeKB}KB`);
    
    // Create download link
    const link = document.createElement('a');
    link.download = `screenshot-selection-${Date.now()}.png`;
    link.href = dataUrl;
    link.textContent = 'Download Selection Screenshot';
    link.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 10000; padding: 10px; background: #28a745; color: white; border-radius: 5px; text-decoration: none; font-family: sans-serif;';
    document.body.appendChild(link);
    
    setTimeout(() => link.remove(), 10000);
    
  } catch (error) {
    console.error('[Canvas Screenshot Test] ✗ FAILED:', error);
  }
}
