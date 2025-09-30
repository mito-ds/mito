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

  console.log('[Canvas Screenshot] Preparing element for SVG capture...');
  console.log('[Canvas Screenshot] Element:', element.tagName, element.className);
  console.log('[Canvas Screenshot] Dimensions:', fullWidth, 'x', fullHeight);
  
  // Clone and prepare the element
  const elementClone = element.cloneNode(true) as HTMLElement;
  
  // Remove problematic content
  sanitizeExternalContent(elementClone);
  cleanupForSVG(elementClone);
  
  // Inline all styles to preserve appearance
  await inlineStyles(element, elementClone);
  
  // Use XMLSerializer for proper escaping
  const serializer = new XMLSerializer();
  let htmlString: string;
  
  try {
    htmlString = serializer.serializeToString(elementClone);
  } catch (serializeError) {
    console.warn('[Canvas Screenshot] XMLSerializer failed, using outerHTML:', serializeError);
    htmlString = elementClone.outerHTML;
  }
  
  // Escape special characters for SVG
  htmlString = escapeHTMLForSVG(htmlString);
  
  const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="${fullWidth}" height="${fullHeight}">
  <foreignObject x="0" y="0" width="${fullWidth}" height="${fullHeight}">
    <div xmlns="http://www.w3.org/1999/xhtml" style="width:${fullWidth}px;height:${fullHeight}px;">
      ${htmlString}
    </div>
  </foreignObject>
</svg>`;

  console.log('[Canvas Screenshot] SVG created, size:', svgData.length, 'bytes');

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
        
        let dataUrl: string;
        try {
          dataUrl = canvas.toDataURL('image/png');
        } catch (securityError) {
          // Canvas is tainted (contains cross-origin content)
          // Fall back to capturing without the problematic content
          console.warn('[Canvas Screenshot] Canvas is tainted, trying fallback method...');
          reject(new Error('Canvas tainted by cross-origin content. Try capturing a region without external images or use the html2canvas fallback.'));
          return;
        }
        
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
      console.error('[Canvas Screenshot] SVG rendering failed.');
      console.log('[Canvas Screenshot] Element type:', element.tagName);
      console.log('[Canvas Screenshot] Element classes:', element.className);
      console.log('[Canvas Screenshot] Element size:', fullWidth, 'x', fullHeight);
      console.log('[Canvas Screenshot] SVG size:', svgData.length, 'bytes');
      console.log('[Canvas Screenshot] SVG preview (first 1000 chars):', svgData.substring(0, 1000));
      
      // Try to identify the issue
      if (svgData.length > 1000000) {
        console.error('[Canvas Screenshot] SVG is very large (>1MB). This might cause rendering failure.');
      }
      
      reject(new Error('Failed to render SVG foreignObject. The selected content may contain complex elements (SVG, canvas, video) or be too large. Try selecting simpler content or a smaller region.'));
    };
    
    // Set crossOrigin to try to avoid tainting (for images with CORS headers)
    img.crossOrigin = 'anonymous';
    img.src = url;
  });
}

/**
 * Escape HTML string for safe embedding in SVG foreignObject
 */
function escapeHTMLForSVG(html: string): string {
  // Don't double-escape, just ensure it's properly formatted
  return html
    .replace(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;')  // Escape unescaped ampersands
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')  // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');  // Remove iframes
}

/**
 * Clean up element for SVG compatibility
 * Remove elements that cause SVG foreignObject to fail
 */
function cleanupForSVG(element: HTMLElement): void {
  // Remove script tags
  const scripts = element.querySelectorAll('script');
  scripts.forEach(script => script.remove());
  
  // Remove iframe tags
  const iframes = element.querySelectorAll('iframe');
  iframes.forEach(iframe => iframe.remove());
  
  // Remove SVG elements (they can cause issues in foreignObject)
  const svgs = element.querySelectorAll('svg');
  svgs.forEach(svg => {
    // Replace with a placeholder div
    const placeholder = document.createElement('div');
    placeholder.style.cssText = `
      width: ${svg.getAttribute('width') || '100'}px;
      height: ${svg.getAttribute('height') || '100'}px;
      background: #f0f0f0;
      display: inline-block;
    `;
    placeholder.textContent = '[SVG content]';
    svg.parentNode?.replaceChild(placeholder, svg);
  });
  
  // Remove canvas elements (they don't render in foreignObject)
  const canvases = element.querySelectorAll('canvas');
  canvases.forEach(canvas => {
    const placeholder = document.createElement('div');
    placeholder.style.cssText = `
      width: ${canvas.width}px;
      height: ${canvas.height}px;
      background: #e0e0e0;
      display: inline-block;
    `;
    placeholder.textContent = '[Canvas content]';
    canvas.parentNode?.replaceChild(placeholder, canvas);
  });
  
  // Remove video and audio elements
  const media = element.querySelectorAll('video, audio');
  media.forEach(el => el.remove());
  
  // Remove elements with display:none (they can cause issues)
  const allElements = element.querySelectorAll('*');
  allElements.forEach(el => {
    if (el instanceof HTMLElement) {
      const display = window.getComputedStyle(el).display;
      if (display === 'none') {
        el.remove();
      }
    }
  });
}

/**
 * Remove or replace external images to prevent canvas tainting
 * This helps avoid CORS issues
 */
function sanitizeExternalContent(element: HTMLElement): void {
  // Find all images
  const images = element.querySelectorAll('img');
  images.forEach((img) => {
    // Check if image is from external origin
    try {
      const imgUrl = new URL(img.src);
      const currentOrigin = window.location.origin;
      
      if (imgUrl.origin !== currentOrigin && !img.src.startsWith('data:')) {
        // Replace with a placeholder or remove
        console.warn(`[Canvas Screenshot] Removing external image: ${img.src}`);
        img.style.display = 'none';
        // Or replace with placeholder:
        // img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
      }
    } catch (e) {
      // Invalid URL, skip
    }
  });
  
  // Remove background images that might be external
  const allElements = element.querySelectorAll('*');
  allElements.forEach((el) => {
    if (el instanceof HTMLElement) {
      const bgImage = window.getComputedStyle(el).backgroundImage;
      if (bgImage && bgImage !== 'none' && !bgImage.includes('data:')) {
        // Check if it's an external URL
        const urlMatch = bgImage.match(/url\(['"]?(.*?)['"]?\)/);
        if (urlMatch && urlMatch[1]) {
          try {
            const bgUrl = new URL(urlMatch[1], window.location.href);
            if (bgUrl.origin !== window.location.origin) {
              console.warn(`[Canvas Screenshot] Removing external background image: ${urlMatch[1]}`);
              el.style.backgroundImage = 'none';
            }
          } catch (e) {
            // Keep it if we can't parse
          }
        }
      }
    }
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
