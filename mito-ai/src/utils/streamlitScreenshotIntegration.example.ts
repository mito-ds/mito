/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

/**
 * Example integration of canvas screenshot capture with Streamlit conversion
 * 
 * This demonstrates how the comment-based editing feature would work:
 * 1. User draws a rectangle over their Streamlit app preview
 * 2. Adds a text description of what they want to change
 * 3. Screenshot + description is sent to AI for code edits
 */

import { captureElement } from './capture';

/**
 * Interface for user selection on the Streamlit preview
 */
interface StreamlitSelection {
  /** X coordinate of selection start */
  x: number;
  /** Y coordinate of selection start */
  y: number;
  /** Width of selection */
  width: number;
  /** Height of selection */
  height: number;
}

/**
 * Interface for comment-based edit request
 */
interface CommentBasedEditRequest {
  /** Base64 PNG screenshot of the selected region */
  screenshot: string;
  /** User's description of what to change */
  description: string;
  /** Current Streamlit app code */
  currentCode: string;
  /** Notebook path for context */
  notebookPath: string;
  /** Optional: Full app screenshot for additional context */
  fullAppScreenshot?: string;
}

/**
 * Captures a screenshot of the Streamlit app preview with user selection
 * 
 * @param previewContainer - The iframe or container showing the Streamlit app
 * @param selection - The rectangular region selected by the user
 * @param description - User's description of desired changes
 * @returns Promise with the edit request ready to send to AI
 */
export async function createCommentBasedEditRequest(
  previewContainer: HTMLElement,
  selection: StreamlitSelection,
  description: string,
  currentCode: string,
  notebookPath: string
): Promise<CommentBasedEditRequest> {
  console.log('[Streamlit Screenshot] Creating comment-based edit request...');
  
  // Capture the selected region
  const screenshot = await captureElement(previewContainer, selection);
  
  // Optionally capture full app for context
  const fullAppScreenshot = await captureElement(previewContainer);
  
  return {
    screenshot,
    description,
    currentCode,
    notebookPath,
    fullAppScreenshot
  };
}

/**
 * Example: Rectangle selection UI handler
 * 
 * This would be integrated into a React component that handles
 * drawing rectangles on the Streamlit preview
 */
export class StreamlitSelectionHandler {
  private startX: number = 0;
  private startY: number = 0;
  private endX: number = 0;
  private endY: number = 0;
  private isSelecting: boolean = false;
  private previewContainer: HTMLElement;
  
  constructor(previewContainer: HTMLElement) {
    this.previewContainer = previewContainer;
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    this.previewContainer.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.previewContainer.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.previewContainer.addEventListener('mouseup', this.handleMouseUp.bind(this));
  }
  
  private handleMouseDown(event: MouseEvent): void {
    this.isSelecting = true;
    const rect = this.previewContainer.getBoundingClientRect();
    this.startX = event.clientX - rect.left;
    this.startY = event.clientY - rect.top;
  }
  
  private handleMouseMove(event: MouseEvent): void {
    if (!this.isSelecting) return;
    
    const rect = this.previewContainer.getBoundingClientRect();
    this.endX = event.clientX - rect.left;
    this.endY = event.clientY - rect.top;
    
    // Update selection rectangle visualization
    this.drawSelectionRectangle();
  }
  
  private handleMouseUp(event: MouseEvent): void {
    if (!this.isSelecting) return;
    
    this.isSelecting = false;
    const rect = this.previewContainer.getBoundingClientRect();
    this.endX = event.clientX - rect.left;
    this.endY = event.clientY - rect.top;
    
    // Show description input dialog
    this.showDescriptionDialog();
  }
  
  private drawSelectionRectangle(): void {
    // Remove existing overlay
    const existingOverlay = document.getElementById('streamlit-selection-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }
    
    // Create new overlay
    const overlay = document.createElement('div');
    overlay.id = 'streamlit-selection-overlay';
    
    const x = Math.min(this.startX, this.endX);
    const y = Math.min(this.startY, this.endY);
    const width = Math.abs(this.endX - this.startX);
    const height = Math.abs(this.endY - this.startY);
    
    overlay.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: ${width}px;
      height: ${height}px;
      border: 2px solid #007bff;
      background: rgba(0, 123, 255, 0.1);
      pointer-events: none;
      z-index: 1000;
    `;
    
    this.previewContainer.appendChild(overlay);
  }
  
  private async showDescriptionDialog(): Promise<void> {
    const description = prompt('Describe what you want to change in this area:');
    
    if (!description) {
      // User cancelled
      this.clearSelection();
      return;
    }
    
    // Get selection coordinates
    const selection: StreamlitSelection = {
      x: Math.min(this.startX, this.endX),
      y: Math.min(this.startY, this.endY),
      width: Math.abs(this.endX - this.startX),
      height: Math.abs(this.endY - this.startY)
    };
    
    try {
      // Capture and send to AI
      await this.captureAndSendToAI(selection, description);
    } catch (error) {
      console.error('[Streamlit Screenshot] Failed to process edit request:', error);
      alert('Failed to process your edit request. Please try again.');
    } finally {
      this.clearSelection();
    }
  }
  
  private async captureAndSendToAI(
    selection: StreamlitSelection,
    description: string
  ): Promise<void> {
    console.log('[Streamlit Screenshot] Capturing selection for AI edit...');
    
    // Get current app code (would come from your state management)
    const currentCode = this.getCurrentStreamlitCode();
    const notebookPath = this.getNotebookPath();
    
    // Create edit request with screenshot
    const editRequest = await createCommentBasedEditRequest(
      this.previewContainer,
      selection,
      description,
      currentCode,
      notebookPath
    );
    
    // Send to backend for AI processing
    await this.sendEditRequestToBackend(editRequest);
  }
  
  private getCurrentStreamlitCode(): string {
    // This would fetch from your app state
    // For now, returning placeholder
    return '# Current Streamlit app code';
  }
  
  private getNotebookPath(): string {
    // This would get the actual notebook path
    return '/path/to/notebook.ipynb';
  }
  
  private async sendEditRequestToBackend(request: CommentBasedEditRequest): Promise<void> {
    // This would call your backend API
    console.log('[Streamlit Screenshot] Sending edit request to backend:', {
      descriptionLength: request.description.length,
      screenshotSize: Math.round((request.screenshot.length * 0.75) / 1024) + 'KB',
      hasFullScreenshot: !!request.fullAppScreenshot
    });
    
    // Example API call:
    // const response = await fetch('/api/streamlit/edit', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(request)
    // });
    // 
    // if (!response.ok) {
    //   throw new Error('Failed to process edit request');
    // }
    // 
    // const result = await response.json();
    // // Apply the AI's code changes...
  }
  
  private clearSelection(): void {
    const overlay = document.getElementById('streamlit-selection-overlay');
    if (overlay) {
      overlay.remove();
    }
    this.startX = 0;
    this.startY = 0;
    this.endX = 0;
    this.endY = 0;
  }
  
  public destroy(): void {
    this.previewContainer.removeEventListener('mousedown', this.handleMouseDown);
    this.previewContainer.removeEventListener('mousemove', this.handleMouseMove);
    this.previewContainer.removeEventListener('mouseup', this.handleMouseUp);
    this.clearSelection();
  }
}

/**
 * Example: Quick test function to try the screenshot capture
 * Run this in the browser console when a Streamlit preview is visible
 */
export async function testStreamlitScreenshot(): Promise<void> {
  // Find the Streamlit preview container (adjust selector as needed)
  const previewContainer = document.querySelector('.streamlit-preview-container') as HTMLElement;
  
  if (!previewContainer) {
    console.error('[Streamlit Screenshot] Preview container not found');
    console.log('[Streamlit Screenshot] Looking for element with class: .streamlit-preview-container');
    return;
  }
  
  console.log('[Streamlit Screenshot] Found preview container');
  console.log('[Streamlit Screenshot] Dimensions:', previewContainer.offsetWidth, 'x', previewContainer.offsetHeight);
  
  // Test full capture
  console.log('[Streamlit Screenshot] Testing full preview capture...');
  const startTime = performance.now();
  const fullScreenshot = await captureElement(previewContainer);
  const duration = performance.now() - startTime;
  const sizeKB = Math.round((fullScreenshot.length * 0.75) / 1024);
  
  console.log('[Streamlit Screenshot] ✓ Full capture complete');
  console.log(`[Streamlit Screenshot] Duration: ${duration.toFixed(2)}ms`);
  console.log(`[Streamlit Screenshot] Size: ${sizeKB}KB`);
  console.log(`[Streamlit Screenshot] Performance: ${duration < 500 ? '✓ PASS' : '✗ FAIL'}`);
  
  // Test region capture (top-left quarter)
  console.log('[Streamlit Screenshot] Testing region capture...');
  const regionSelection = {
    x: 0,
    y: 0,
    width: Math.floor(previewContainer.offsetWidth / 2),
    height: Math.floor(previewContainer.offsetHeight / 2)
  };
  
  const startTime2 = performance.now();
  const regionScreenshot = await captureElement(previewContainer, regionSelection);
  const duration2 = performance.now() - startTime2;
  const sizeKB2 = Math.round((regionScreenshot.length * 0.75) / 1024);
  
  console.log('[Streamlit Screenshot] ✓ Region capture complete');
  console.log(`[Streamlit Screenshot] Duration: ${duration2.toFixed(2)}ms`);
  console.log(`[Streamlit Screenshot] Size: ${sizeKB2}KB`);
  
  // Create download links
  createDownloadLink(fullScreenshot, 'streamlit-full-screenshot.png', 'Download Full Screenshot');
  createDownloadLink(regionScreenshot, 'streamlit-region-screenshot.png', 'Download Region Screenshot');
}

function createDownloadLink(dataUrl: string, filename: string, text: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.textContent = text;
  link.style.cssText = `
    display: block;
    margin: 10px;
    padding: 10px;
    background: #007bff;
    color: white;
    border-radius: 5px;
    text-decoration: none;
    font-family: sans-serif;
    position: fixed;
    top: ${document.querySelectorAll('a[download]').length * 50 + 10}px;
    right: 10px;
    z-index: 10000;
  `;
  document.body.appendChild(link);
  
  setTimeout(() => link.remove(), 15000);
}

// Export for console testing
if (typeof window !== 'undefined') {
  (window as any).testStreamlitScreenshot = testStreamlitScreenshot;
  console.log('[Streamlit Screenshot] Test function available: testStreamlitScreenshot()');
}
