# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""
JupyterLab helpers for interactive graphs:

- **Plotly**: set the JupyterLab MIME renderer (via ``enable_plotly_in_jupyterlab``).
- **Matplotlib**: switch to the ``widget`` backend (ipympl) for pan/zoom/hover on the canvas.

Matplotlib figures that were already saved as static PNGs in the notebook cannot be
upgraded to interactive; you need the widget backend *before* drawing new plots.
"""

from __future__ import annotations

import sys
import warnings


def _matplotlib_pyplot_using_inline_backend() -> bool:
    """True if pyplot is loaded and the active backend is a non-interactive notebook inline backend."""
    if "matplotlib.pyplot" not in sys.modules:
        return False
    import matplotlib

    name = matplotlib.get_backend().lower()
    return "inline" in name


def enable_plotly_in_jupyterlab() -> None:
    """
    Point Plotly at the JupyterLab renderer so ``fig.show()`` draws in the notebook.

    Call once per kernel (e.g. first cell) if ``plotly.io.renderers.default`` is
    still ``browser`` or another non-embedded renderer.
    """
    import plotly.io as pio

    pio.renderers.default = "jupyterlab"


def enable_matplotlib_in_jupyterlab() -> None:
    """
    Use the **ipympl** (``widget``) backend so Matplotlib draws an interactive canvas
    in JupyterLab (pan, zoom, resize, toolbar).

    Requires the optional install::

        pip install 'jupyterlab-interactive-graphs[matplotlib]'

    **Call once per kernel**, ideally before ``import matplotlib.pyplot``; if pyplot
    was already imported (e.g. ``inline`` backend), this tries
    ``pyplot.switch_backend('widget')``.
    """
    import importlib.util

    if importlib.util.find_spec("ipympl") is None:
        raise ImportError(
            "Interactive Matplotlib in JupyterLab needs ipympl. Install:\n"
            "  pip install 'jupyterlab-interactive-graphs[matplotlib]'\n"
            "Then restart the kernel and call enable_matplotlib_in_jupyterlab() again."
        ) from None

    # Registers the 'widget' backend name with Matplotlib.
    import ipympl  # noqa: F401

    import matplotlib as mpl

    if "matplotlib.pyplot" in sys.modules:
        import matplotlib.pyplot as plt

        plt.switch_backend("widget")
    else:
        mpl.use("widget")


def configure(
    *,
    plotly: bool = True,
    matplotlib_interactive: bool = True,
    warn_if_inline: bool = True,
) -> None:
    """
    Apply the usual JupyterLab settings for interactive Plotly and Matplotlib.

    Parameters
    ----------
    plotly
        Set Plotly's renderer to ``jupyterlab``.
    matplotlib_interactive
        Switch Matplotlib to the ipympl ``widget`` backend. If ipympl is not
        installed, logs a warning and skips (Plotly still runs if requested).
    warn_if_inline
        If ``matplotlib.pyplot`` is already imported with the **inline** backend
        (static PNG), emit a reminder to call ``configure()`` *before* ``import
        matplotlib.pyplot`` next time; the ``widget`` switch is still attempted
        right after.
    """
    if plotly:
        try:
            enable_plotly_in_jupyterlab()
        except ImportError:
            warnings.warn(
                "plotly is not installed; skipped Plotly renderer setup. "
                "Install plotly or call configure(plotly=False).",
                stacklevel=2,
            )
    if matplotlib_interactive:
        if warn_if_inline and _matplotlib_pyplot_using_inline_backend():
            warnings.warn(
                "Matplotlib is on the inline backend (static PNG only). "
                "Call configure() before import matplotlib.pyplot next time; "
                "switching to widget now.",
                stacklevel=2,
            )
        try:
            enable_matplotlib_in_jupyterlab()
        except ImportError as e:
            warnings.warn(str(e), stacklevel=2)


def _jupyter_labextension_paths():
    return [{"src": "labextension", "dest": "jupyterlab-interactive-graphs"}]
