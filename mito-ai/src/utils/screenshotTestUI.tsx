/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { testCapture, testCaptureWithSelection, captureCellWithMetrics } from './capture';

/**
 * Creates an overlay UI for testing screenshot capture with rectangle selection
 * This can be triggered from a JupyterLab command or button
 */
export class ScreenshotTestUI {
  private overlay: HTMLDivElement | null = null;
  private selectionRect: HTMLDivElement | null = null;
  private isSelecting: boolean = false;
  private startX: number = 0;
  private startY: number = 0;
  
  constructor() {
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
  }
  
  /**
   * Show the screenshot test UI overlay
   */
  public show(): void {
    if (this.overlay) {
      return; // Already showing
    }
    
    this.overlay = this.createOverlay();
    document.body.appendChild(this.overlay);
    
    // Add event listeners
    document.addEventListener('mousedown', this.handleMouseDown);
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('keydown', this.handleKeyPress);
    
    console.log('[Screenshot Test] UI activated. Click and drag to select a region, or press ESC to exit.');
  }
  
  /**
   * Hide and cleanup the screenshot test UI
   */
  public hide(): void {
    if (!this.overlay) {
      return;
    }
    
    document.body.removeChild(this.overlay);
    this.overlay = null;
    
    if (this.selectionRect && this.selectionRect.parentNode) {
      this.selectionRect.parentNode.removeChild(this.selectionRect);
      this.selectionRect = null;
    }
    
    // Remove event listeners
    document.removeEventListener('mousedown', this.handleMouseDown);
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('keydown', this.handleKeyPress);
    
    console.log('[Screenshot Test] UI closed.');
  }
  
  private createOverlay(): HTMLDivElement {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.1);
      z-index: 10000;
      cursor: crosshair;
      pointer-events: all;
    `;
    
    // Create instructions panel
    const instructions = document.createElement('div');
    instructions.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 123, 255, 0.95);
      color: white;
      padding: 15px 25px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 10001;
      pointer-events: none;
    `;
    instructions.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px;">📸 Screenshot Test Mode</div>
      <div>Click and drag to select a region • Press ESC to cancel</div>
    `;
    
    overlay.appendChild(instructions);
    
    return overlay;
  }
  
  private handleMouseDown(e: MouseEvent): void {
    if (!this.overlay) return;
    
    // Check if clicking on the overlay (not on instructions)
    if (e.target !== this.overlay) return;
    
    this.isSelecting = true;
    this.startX = e.clientX;
    this.startY = e.clientY;
    
    // Remove previous selection rectangle if exists
    if (this.selectionRect && this.selectionRect.parentNode) {
      this.selectionRect.parentNode.removeChild(this.selectionRect);
    }
    
    // Create new selection rectangle
    this.selectionRect = document.createElement('div');
    this.selectionRect.style.cssText = `
      position: fixed;
      border: 2px solid #007bff;
      background: rgba(0, 123, 255, 0.2);
      pointer-events: none;
      z-index: 10002;
    `;
    document.body.appendChild(this.selectionRect);
  }
  
  private handleMouseMove(e: MouseEvent): void {
    if (!this.isSelecting || !this.selectionRect) return;
    
    const x = Math.min(this.startX, e.clientX);
    const y = Math.min(this.startY, e.clientY);
    const width = Math.abs(e.clientX - this.startX);
    const height = Math.abs(e.clientY - this.startY);
    
    this.selectionRect.style.left = `${x}px`;
    this.selectionRect.style.top = `${y}px`;
    this.selectionRect.style.width = `${width}px`;
    this.selectionRect.style.height = `${height}px`;
  }
  
  private async handleMouseUp(e: MouseEvent): Promise<void> {
    if (!this.isSelecting || !this.selectionRect) return;
    
    this.isSelecting = false;
    
    const x = Math.min(this.startX, e.clientX);
    const y = Math.min(this.startY, e.clientY);
    const width = Math.abs(e.clientX - this.startX);
    const height = Math.abs(e.clientY - this.startY);
    
    // Check if selection is large enough
    if (width < 20 || height < 20) {
      console.log('[Screenshot Test] Selection too small. Try again!');
      if (this.selectionRect.parentNode) {
        this.selectionRect.parentNode.removeChild(this.selectionRect);
      }
      this.selectionRect = null;
      return;
    }
    
    // Hide UI temporarily
    this.hide();
    
    // Small delay to let the UI disappear
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      console.log(`[Screenshot Test] Capturing region: ${width}x${height} at (${x}, ${y})`);
      
      // Find the element under the selection
      const element = document.elementFromPoint(
        x + width / 2,
        y + height / 2
      ) as HTMLElement;
      
      if (!element) {
        throw new Error('Could not find element at selection point');
      }
      
      // Get the element's bounding box
      const elementRect = element.getBoundingClientRect();
      
      // Calculate selection relative to element
      const selection = {
        x: Math.max(0, x - elementRect.left),
        y: Math.max(0, y - elementRect.top),
        width: Math.min(width, elementRect.width),
        height: Math.min(height, elementRect.height)
      };
      
      const startTime = performance.now();
      const { dataUrl, duration, sizeKB } = await captureCellWithMetrics(element);
      
      console.log('[Screenshot Test] ✅ SUCCESS');
      console.log(`[Screenshot Test] Duration: ${duration.toFixed(2)}ms`);
      console.log(`[Screenshot Test] Size: ${sizeKB}KB`);
      console.log(`[Screenshot Test] Performance: ${duration < 500 ? '✅ PASS (<500ms)' : '⚠️ SLOW (>500ms)'}`);
      
      // Create download link
      this.createDownloadLink(dataUrl);
      
      // Show success notification
      this.showNotification(`✅ Screenshot captured! (${duration.toFixed(2)}ms, ${sizeKB}KB)`, 'success');
      
    } catch (error) {
      console.error('[Screenshot Test] ✗ FAILED:', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('tainted') || errorMessage.includes('cross-origin')) {
        this.showNotification(
          '❌ Screenshot failed: Canvas is tainted by cross-origin content (external images/fonts). Try capturing a different region or use content without external resources.',
          'error'
        );
        console.log('[Screenshot Test] Tip: The selected area contains external images or resources that cannot be captured due to browser security. Try selecting a region with only text or local content.');
      } else {
        this.showNotification(`❌ Screenshot failed: ${errorMessage}`, 'error');
      }
    }
  }
  
  private handleKeyPress(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      this.hide();
    }
  }
  
  private createDownloadLink(dataUrl: string): void {
    const link = document.createElement('a');
    link.download = `screenshot-${Date.now()}.png`;
    link.href = dataUrl;
    link.textContent = 'Download Screenshot';
    link.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      padding: 12px 20px;
      background: #28a745;
      color: white;
      border-radius: 6px;
      text-decoration: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      cursor: pointer;
      transition: background 0.2s;
    `;
    
    link.addEventListener('mouseenter', () => {
      link.style.background = '#218838';
    });
    
    link.addEventListener('mouseleave', () => {
      link.style.background = '#28a745';
    });
    
    document.body.appendChild(link);
    
    // Auto-remove after 15 seconds
    setTimeout(() => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    }, 15000);
  }
  
  private showNotification(message: string, type: 'success' | 'error'): void {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      padding: 15px 20px;
      background: ${type === 'success' ? '#28a745' : '#dc3545'};
      color: white;
      border-radius: 6px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      max-width: 400px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }
}

/**
 * Global instance for easy access
 */
let screenshotTestUI: ScreenshotTestUI | null = null;

/**
 * Show the screenshot test UI
 */
export function showScreenshotTestUI(): void {
  if (!screenshotTestUI) {
    screenshotTestUI = new ScreenshotTestUI();
  }
  screenshotTestUI.show();
}

/**
 * Hide the screenshot test UI
 */
export function hideScreenshotTestUI(): void {
  if (screenshotTestUI) {
    screenshotTestUI.hide();
  }
}
