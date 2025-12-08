/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { ReactWidget } from '@jupyterlab/ui-components';
import React from 'react';
import MitoViewer from './MitoViewer';

/**
 * The default mime type for the Mito DataFrame viewer.
 */
const MIME_TYPE = 'application/x.mito+json';

/**
 * The class name added to the extension.
 */
const CLASS_NAME = 'mito-mime-renderer';

/**
 * Interface defining the data payload structure for the Mito viewer.
 * This matches the payload structure from the Python formatter.
 */
interface MitoViewerPayload {
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
 * A widget for rendering Mito DataFrame viewer.
 */
export class MitoMimeRenderer extends ReactWidget implements IRenderMime.IRenderer {
  /**
   * Construct a new Mito DataFrame viewer widget.
   */
  constructor(options: IRenderMime.IRendererOptions) {
    super();
    this._mimeType = options.mimeType;
    this.addClass(CLASS_NAME);
    this.node.style.overflow = 'auto';
  }

  /**
   * Render Mito DataFrame into this widget's node.
   */
  async renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    this._data = model.data[this._mimeType] as any as MitoViewerPayload;

    return this.renderPromise ?? Promise.resolve();
  }

  protected render(): (React.ReactElement<any, string | React.JSXElementConstructor<any>>[] | React.ReactElement<any, string | React.JSXElementConstructor<any>>) | null {
    return (this._data ? <MitoViewer payload={this._data} /> : null);
  }

  private _data: MitoViewerPayload | null = null;
  private _mimeType: string;
}

/**
 * A mime renderer factory for Mito DataFrame data.
 */
export const rendererFactory: IRenderMime.IRendererFactory = {
  safe: true,
  mimeTypes: [MIME_TYPE],
  createRenderer: options => new MitoMimeRenderer(options)
};

/**
 * Extension definition for the Mito DataFrame viewer.
 */
const renderMimePlugin: IRenderMime.IExtension = {
  id: 'mitosheet:viewer',
  description: 'Mito DataFrame Viewer',
  rendererFactory,
  rank: 0, // Set rank to ensure it's prioritized over default JSON renderer
  dataType: 'json'
};

export default renderMimePlugin;