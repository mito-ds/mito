/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { JupyterFrontEndPlugin } from '@jupyterlab/application';

import { matplotlibToolbarPlugin } from './matplotlibToolbarPlugin';
import { mitoGraphToolbarPlugin } from './mitoGraphToolbarPlugin';

/**
 * Matplotlib (ipympl) restyle + Mito graph toolbar beside outputs.
 * (Plotly MIME renderer is a separate lab entry: mimeExtension → plotlyRenderer.)
 */
const plugins: JupyterFrontEndPlugin<void>[] = [
  matplotlibToolbarPlugin,
  mitoGraphToolbarPlugin
];

export default plugins;
