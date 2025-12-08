import React from 'react';
import { createRoot } from 'react-dom/client';
import MitoViewer from './MitoViewer';

/**
 * Interface defining the complete data payload passed from Python to the React component.
 * This is a duplicate of the interface in MitoViewer.tsx to ensure type safety
 * for the global API that can be called from external JavaScript code.
 */
interface ViewerPayload {
  /** Array of column metadata containing name and dtype information */
  columns: Array<{ name: string; dtype: string }>;
  /** 2D array of string values representing the DataFrame data */
  data: string[][];
  /** Flag indicating whether the DataFrame was truncated */
  isTruncated: boolean;
  /** Optional warning message displayed when the DataFrame is truncated */
  truncationMessage?: string;
  /** Total number of rows in the original DataFrame */
  totalRows: number;
  /** Number of rows actually being displayed */
  displayRows: number;
}

/**
 * Interface defining the public API for the MitoViewer.
 * This API is exposed globally via the window object and can be called
 * from external JavaScript code to render DataFrame viewers.
 */
interface MitoViewerAPI {
  /**
   * Renders a DataFrame viewer in the specified container element.
   * 
   * @param containerId - The ID of the DOM element where the viewer should be rendered
   * @param payload - The DataFrame data and metadata to display
   */
  render: (containerId: string, payload: ViewerPayload) => void;
}

// Create the global API object
const mitoViewerAPI: MitoViewerAPI = {
  render: (containerId: string, payload: ViewerPayload) => {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with id ${containerId} not found`);
      return;
    }

    // Clear existing content
    container.innerHTML = '';

    // Create React root and render the component
    const root = createRoot(container);
    root.render(React.createElement(MitoViewer, { payload }));
  }
};

// Make the API available globally
declare global {
  interface Window {
    mitoViewer: MitoViewerAPI;
  }
}

// Assign to window object
if (typeof window !== 'undefined') {
  window.mitoViewer = mitoViewerAPI;
}

export default mitoViewerAPI;