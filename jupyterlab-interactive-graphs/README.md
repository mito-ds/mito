# jupyterlab-interactive-graphs

JupyterLab 4 **prebuilt lab extension** plus small **Python helpers** so notebook graphs are interactive.

## Mito graph toolbar (beside outputs)

A **Mito-branded strip** (“Mito” + “Graph”) is inserted **next to** graph-like cell outputs in notebooks. Detection is **heuristic** (DOM-based), including:

- **Plotly** (`.plotly-graph-div`, etc.)
- **Matplotlib / ipympl** (`.jupyter-matplotlib`, …)
- **Bokeh** (`.bk-root`, …)
- **Vega / Altair** (`.vega-embed`, …)
- **Static** `image/png` and `image/svg+xml` outputs (e.g. `plt.savefig` buffer, many Seaborn defaults)

**Caveats:** Any **generic PNG** in an output may also match (e.g. screenshots). Outputs in **iframes** or unusual renderers may be skipped. This toolbar is **visual chrome** only until you wire actions (export, open in Mito, etc.).

## Plotly (Lab extension)

Renders `application/vnd.plotly.v1+json` with defaults tuned for exploration:

- **Hover** tooltips (`hovermode: closest`)
- **Box / lasso select** where Plotly supports it (`dragmode: select`)
- **Scroll zoom**, visible **mode bar**, **responsive** sizing

### Plotly renderer (important)

Plotly’s default renderer is often **`browser`**, which **does not** draw inside the notebook. At the start of the kernel run:

```python
from jupyterlab_interactive_graphs import enable_plotly_in_jupyterlab
enable_plotly_in_jupyterlab()
```

or `import plotly.io as pio; pio.renderers.default = "jupyterlab"`.

## Matplotlib toolbar appearance

This package ships a Lab plugin that tags each **ipympl** toolbar with `jp-InteractiveGraphs-mplToolbar` (so overrides win over widget defaults) and applies a **glass-style** panel, larger rounded buttons, hover lift, and accent styling for the active tool—using JupyterLab theme variables (`--jp-*`), including a dark-theme tweak.

## Matplotlib (Python + ipympl)

**A JupyterLab extension cannot turn an already-rendered PNG into an interactive chart** — the pixel output has no geometry. Interactive Matplotlib in Lab uses the **`widget` backend** from **ipympl** (canvas + toolbar: pan, zoom, home, etc.).

1. Install the optional extra:

   ```bash
   pip install 'jupyterlab-interactive-graphs[matplotlib]'
   ```

2. Before plotting (ideally the first code cell), run:

   ```python
   from jupyterlab_interactive_graphs import enable_matplotlib_in_jupyterlab
   enable_matplotlib_in_jupyterlab()
   ```

   If you already ran `import matplotlib.pyplot as plt` with another backend, this package tries `plt.switch_backend("widget")`; if that fails, restart the kernel and call the helper **before** importing pyplot.

3. Ensure JupyterLab has the widgets stack (`@jupyter-widgets/jupyterlab-manager`); it is normally pulled in with `ipywidgets` / `ipympl`.

### One call for both libraries

```python
from jupyterlab_interactive_graphs import configure
configure()
```

This sets Plotly’s renderer and, if **ipympl** is installed, Matplotlib’s `widget` backend. If ipympl is missing, a **warning** is shown and Plotly setup still runs.

If you already ran `import matplotlib.pyplot` with the **inline** backend, `configure()` still switches to **widget** but emits a **warning** so you know to call `configure()` first next kernel. Disable that with `configure(warn_if_inline=False)`.

## Development install

From this directory:

```bash
pip install -e ".[matplotlib]"
```

Rebuild the JS after TypeScript changes:

```bash
jlpm install
jlpm run build:lib
python3 -m jupyter labextension build --development True .
```

Restart JupyterLab and refresh the browser.

## License

AGPL-3.0-only (see repository).
