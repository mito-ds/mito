/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { ReactWidget } from '@jupyterlab/ui-components';
import React from 'react';
import { MitoViewer, type ViewerPayload } from './MitoViewer';

/**
 * The default mime type for the Mito DataFrame viewer.
 */
const MIME_TYPE = 'application/x.mito+json';

/**
 * The class name added to the extension.
 */
const CLASS_NAME = 'mito-mime-renderer';

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
        this._data = model.data[this._mimeType] as any as ViewerPayload;

        return this.renderPromise ?? Promise.resolve();
    }

    protected render(): (React.ReactElement<any, string | React.JSXElementConstructor<any>>[] | React.ReactElement<any, string | React.JSXElementConstructor<any>>) | null {
        return (this._data ? <MitoViewer payload={this._data} /> : null);
    }

    private _data: ViewerPayload | null = null;
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