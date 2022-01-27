// Copyright (c) Mito

export * from './version';
export * from './widget';

// We need to explore the plugin directly from this file
// as only jlab 3 requires is, and jlab 2 ignores it
import examplePlugin from './plugin';
export default examplePlugin;