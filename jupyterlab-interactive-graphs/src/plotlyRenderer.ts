/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { Widget } from '@lumino/widgets';
import Plotly from 'plotly.js-dist-min';
import type { Config, Data, Layout } from 'plotly.js';

/** Plotly MIME type produced by plotly.py in Jupyter (and many libraries that wrap it). */
const PLOTLY_MIME = 'application/vnd.plotly.v1+json';

/**
 * Figure JSON as emitted by plotly.py `fig.to_plotly_json()` / notebook display.
 */
interface IPlotlyFigureSpec {
  data?: Data[];
  layout?: Partial<Layout>;
  config?: Partial<Config>;
  frames?: unknown;
}

function parseFigure(raw: unknown): IPlotlyFigureSpec {
  if (raw == null) {
    return {};
  }
  if (typeof raw === 'string') {
    return JSON.parse(raw) as IPlotlyFigureSpec;
  }
  return raw as IPlotlyFigureSpec;
}

/**
 * Merge interactive defaults: strong hover + box/lasso selection where Plotly supports it.
 */
function mergeInteractiveLayout(layout: Partial<Layout> | undefined): Partial<Layout> {
  return {
    autosize: true,
    hovermode: 'closest',
    dragmode: 'select',
    ...layout
  };
}

function mergeInteractiveConfig(config: Partial<Config> | undefined): Partial<Config> {
  return {
    responsive: true,
    scrollZoom: true,
    displayModeBar: true,
    ...config
  };
}

class PlotlyInteractiveRenderer extends Widget implements IRenderMime.IRenderer {
  private _resizeObserver: ResizeObserver | null = null;

  constructor(options: IRenderMime.IRendererOptions) {
    super();
    this.addClass('jp-InteractiveGraphs-plotly');
    this.node.style.minHeight = '360px';
    this.node.style.width = '100%';
    this._mimeType = options.mimeType;
  }

  private _mimeType: string;

  async renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    const raw = model.data[this._mimeType];
    const spec = parseFigure(raw);
    const data = spec.data ?? [];
    const layout = mergeInteractiveLayout(spec.layout);
    const config = mergeInteractiveConfig(spec.config);

    await Plotly.react(this.node, data, layout as Layout, config as Config);

    this._resizeObserver?.disconnect();
    this._resizeObserver = new ResizeObserver(() => {
      void Plotly.Plots.resize(this.node);
    });
    this._resizeObserver.observe(this.node);
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
    try {
      Plotly.purge(this.node);
    } catch {
      /* ignore purge errors on empty/torn-down nodes */
    }
    super.dispose();
  }
}

export const rendererFactory: IRenderMime.IRendererFactory = {
  safe: false,
  mimeTypes: [PLOTLY_MIME],
  createRenderer: (options: IRenderMime.IRendererOptions) =>
    new PlotlyInteractiveRenderer(options)
};

/**
 * Rank above the default Plotly lab extension so our renderer (with selection defaults) wins.
 */
export const plotlyMimePlugin: IRenderMime.IExtension = {
  id: 'jupyterlab-interactive-graphs:plotly',
  description: 'Plotly graphs with hover and selection tools enabled by default',
  rendererFactory,
  rank: 100,
  dataType: 'json'
};

export default plotlyMimePlugin;
