/**
 * Entry point for the MitoViewer React component bundle.
 * 
 * This file serves as the main entry point for the esbuild bundling process.
 * It imports the main index file which sets up the global API and makes the
 * MitoViewer available for use in browser environments.
 * 
 * The bundled output will be a self-contained IIFE (Immediately Invoked Function
 * Expression) that can be loaded via script tag and will automatically register
 * the mitoViewer API on the global window object.
 */

import './index';

// Re-export for potential module usage when imported as an ES module
export { default } from './index';
export { default as MitoViewer } from './MitoViewer';