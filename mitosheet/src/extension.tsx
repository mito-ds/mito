// Copyright (c) Jupyter Development Team.

// Entry point for the notebook bundle containing custom model definitions.
//
// Setup notebook base URL
//
// Some static assets may be required by the custom widget javascript. The base
// url for the notebook is not known at build time and is therefore computed
// dynamically.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).__webpack_public_path__ =
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  document.querySelector('body')!.getAttribute('data-base-url') +
  'nbextensions/mito';

export * from './index';
