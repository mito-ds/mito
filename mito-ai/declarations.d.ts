/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Tells Typescript to treat svg files as strings 
// so that we can import them in our code
declare module '*.svg' {
    const content: string;
    export default content;
}

// JupyterLab file editor tracker (provided by the app at runtime when present)
declare module '@jupyterlab/fileeditor' {
  import type { Token } from '@lumino/coreutils';

  interface IToolbarLike {
    node: HTMLElement;
    insertAfter(ref: string, id: string, widget: unknown): void;
    addItem(id: string, widget: unknown): void;
    querySelector(selectors: string): Element | null;
  }

  export interface IEditorTracker {
    readonly currentWidget: { context: { path: string }; toolbar: IToolbarLike } | null;
    readonly widgetAdded: { connect(cb: (sender: unknown, widget: unknown) => void): unknown };
    readonly currentChanged: { connect(cb: () => void): unknown };
  }

  export const IEditorTracker: Token<IEditorTracker>;
}