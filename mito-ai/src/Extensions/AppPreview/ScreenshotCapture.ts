/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';
import { Rectangle } from './SelectionOverlay';

export interface CaptureState {
  scrollX: number;
  scrollY: number;
  viewportWidth: number;
  viewportHeight: number;
  selection: Rectangle;
}

/**
 * Client for server-side screenshot API
 */
export class ScreenshotCapture {
  private serverSettings: ServerConnection.ISettings;

  constructor() {
    this.serverSettings = ServerConnection.makeSettings();
  }

  /**
   * Capture screenshot of Streamlit app region
   * @param iframe - The iframe element containing Streamlit
   * @param selection - Rectangle coordinates relative to viewport
   * @returns Blob containing PNG screenshot
   */
  async captureRegion(
    iframe: HTMLIFrameElement,
    selection: Rectangle
  ): Promise<Blob> {
    // Capture current state of iframe
    const state = this.captureIframeState(iframe, selection);

    // Request screenshot from server
    const endpoint = URLExt.join(
      this.serverSettings.baseUrl,
      'mito-ai/streamlit-screenshot'
    );

    const response = await ServerConnection.makeRequest(
      endpoint,
      {
        method: 'POST',
        body: JSON.stringify(state),
        headers: {
          'Content-Type': 'application/json'
        }
      },
      this.serverSettings
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Screenshot failed: ${error}`);
    }

    return await response.blob();
  }

  /**
   * Capture current scroll position and viewport state
   * NOTE: iframe.contentWindow may be null due to cross-origin restrictions,
   * but we can try to access it. If it fails, we'll default to no scroll.
   */
  private captureIframeState(
    iframe: HTMLIFrameElement,
    selection: Rectangle
  ): CaptureState {
    let scrollX = 0;
    let scrollY = 0;

    try {
      const iframeWindow = iframe.contentWindow;
      if (iframeWindow) {
        scrollX = iframeWindow.scrollX;
        scrollY = iframeWindow.scrollY;
      }
    } catch (e) {
      // Cross-origin restriction - default to 0,0
      console.warn('Cannot access iframe scroll position (cross-origin)');
    }

    return {
      scrollX: scrollX,
      scrollY: scrollY,
      viewportWidth: iframe.offsetWidth,
      viewportHeight: iframe.offsetHeight,
      selection: selection
    };
  }

  /**
   * Estimate time for screenshot (for UI feedback)
   */
  estimateCaptureTime(): number {
    return 500; // ~500ms average
  }
}
