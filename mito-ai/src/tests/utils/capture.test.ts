/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { captureElement, captureCellWithMetrics } from '../../utils/capture';

describe('Canvas Screenshot Capture', () => {
  let testElement: HTMLElement;

  beforeEach(() => {
    // Create a test element with some content and styles
    testElement = document.createElement('div');
    testElement.style.width = '400px';
    testElement.style.height = '300px';
    testElement.style.backgroundColor = '#f0f0f0';
    testElement.style.padding = '20px';
    testElement.style.border = '2px solid #333';
    
    const heading = document.createElement('h1');
    heading.textContent = 'Test Heading';
    heading.style.color = '#007bff';
    heading.style.marginBottom = '10px';
    
    const paragraph = document.createElement('p');
    paragraph.textContent = 'This is a test paragraph with some content.';
    paragraph.style.color = '#333';
    
    testElement.appendChild(heading);
    testElement.appendChild(paragraph);
    
    document.body.appendChild(testElement);
  });

  afterEach(() => {
    if (testElement.parentNode) {
      testElement.parentNode.removeChild(testElement);
    }
  });

  test('captureElement returns a data URL', async () => {
    const dataUrl = await captureElement(testElement);
    
    expect(dataUrl).toBeDefined();
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  test('captureElement with selection returns cropped image', async () => {
    const selection = { x: 10, y: 10, width: 100, height: 100 };
    const dataUrl = await captureElement(testElement, selection);
    
    expect(dataUrl).toBeDefined();
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  test('captureCellWithMetrics returns performance data', async () => {
    const result = await captureCellWithMetrics(testElement);
    
    expect(result.dataUrl).toBeDefined();
    expect(result.duration).toBeGreaterThan(0);
    expect(result.sizeKB).toBeGreaterThan(0);
    
    // Log for manual inspection
    console.log(`Capture duration: ${result.duration.toFixed(2)}ms`);
    console.log(`Capture size: ${result.sizeKB}KB`);
  });

  test('capture completes within performance target', async () => {
    const result = await captureCellWithMetrics(testElement);
    
    // Success criteria: <500ms
    expect(result.duration).toBeLessThan(500);
  }, 10000); // Increase timeout for this test

  test('captureElement handles missing element gracefully', async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      // If we can't get a context, skip the test
      return;
    }

    // This should still work with an empty element
    const emptyElement = document.createElement('div');
    document.body.appendChild(emptyElement);
    
    try {
      const dataUrl = await captureElement(emptyElement);
      expect(dataUrl).toBeDefined();
    } finally {
      emptyElement.remove();
    }
  });

  test('captureElement preserves dimensions', async () => {
    const width = 400;
    const height = 300;
    
    testElement.style.width = `${width}px`;
    testElement.style.height = `${height}px`;
    
    const dataUrl = await captureElement(testElement);
    
    // Create an image to verify dimensions
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        expect(img.width).toBe(width);
        expect(img.height).toBe(height);
        resolve();
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  });

  test('selection dimensions are respected', async () => {
    const selection = { x: 0, y: 0, width: 200, height: 150 };
    const dataUrl = await captureElement(testElement, selection);
    
    // Verify the output image matches the selection dimensions
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        expect(img.width).toBe(selection.width);
        expect(img.height).toBe(selection.height);
        resolve();
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  });

  test('handles complex nested elements', async () => {
    // Create a more complex DOM structure
    const complexElement = document.createElement('div');
    complexElement.style.width = '500px';
    complexElement.style.height = '400px';
    
    for (let i = 0; i < 5; i++) {
      const section = document.createElement('div');
      section.style.padding = '10px';
      section.style.backgroundColor = i % 2 === 0 ? '#e0e0e0' : '#f5f5f5';
      
      const title = document.createElement('h2');
      title.textContent = `Section ${i + 1}`;
      title.style.color = '#333';
      
      const content = document.createElement('p');
      content.textContent = `Content for section ${i + 1}`;
      
      section.appendChild(title);
      section.appendChild(content);
      complexElement.appendChild(section);
    }
    
    document.body.appendChild(complexElement);
    
    try {
      const result = await captureCellWithMetrics(complexElement);
      
      expect(result.dataUrl).toBeDefined();
      expect(result.duration).toBeLessThan(500);
      
      console.log(`Complex element capture: ${result.duration.toFixed(2)}ms, ${result.sizeKB}KB`);
    } finally {
      complexElement.remove();
    }
  }, 10000);
});
