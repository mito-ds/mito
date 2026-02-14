# Mito Spreadsheet — Supported Environments

The Mito spreadsheet is built to work in **five environments**. The same Python backend (`MitoBackend`) and shared React frontend are used everywhere; only the **transport** and **host** differ per environment.

## Summary

| Environment   | How to use                    | Transport              |
|---------------|-------------------------------|------------------------|
| **JupyterLab**| `mitosheet.sheet()`           | Jupyter kernel comm    |
| **VSCode**    | `mitosheet.sheet()`           | Jupyter comm (nbextension + ipywidget) |
| **Databricks**| `mitosheet.sheet()`           | Jupyter-style comm (same as JupyterLab) |
| **Streamlit** | `mitosheet.sheet()` or `mitosheet.streamlit.spreadsheet()` | Streamlit component value round-trip |
| **Dash**      | `Spreadsheet` component in layout + `activate_mito(app)` | Dash callbacks |

## 1. JupyterLab

- **Entry point:** `mitosheet.sheet()` (or `mitosheet.sheet(df1, df2)`).
- **How it works:** The notebook injects HTML + JS that opens a **Jupyter kernel comm** with a unique target id. The frontend sends edit/update events over the comm; the backend (`MitoBackend`) handles them and sends back shared state (sheet data, analysis data, user profile).
- **Build:** Lab extension is built into `mitosheet/labextension`. The classic path uses `get_mito_frontend_code()` which inlines the frontend JS and replaces placeholders (comm target id, kernel id, initial state bytes).

## 2. VSCode

- **Entry point:** Same as JupyterLab: `mitosheet.sheet()`.
- **How it works:** VSCode’s Jupyter extension runs a Jupyter kernel and can render ipywidgets. We use a small **ipywidget** (`MitoLoaderWidget`) that receives `comm_target_id`, initial state JSON, and `div_id`. The widget view loads the same Mito frontend bundle and provides a **comm** (from the widget manager) so the frontend talks to the same Python backend via the kernel. We also copy the **nbextension** into `share/jupyter/nbextensions/mitosheet` so the widget manager can load the view.
- **Detection:** `is_in_vs_code()` checks for the `VSCODE_PID` environment variable.

## 3. Databricks

- **Entry point:** Same as JupyterLab: `mitosheet.sheet()`.
- **How it works:** Databricks notebooks use a Jupyter-compatible kernel. We do **not** block `sheet()` in Databricks; it uses the same comm-based path as JupyterLab (HTML + comm target). No separate component is required.
- **Detection:** `is_databricks()` checks for the `DATABRICKS_RUNTIME_VERSION` environment variable. Telemetry reports `location_databricks`.

## 4. Streamlit

- **Entry point:**  
  - **Unified:** `mitosheet.sheet()` — when running inside Streamlit, this delegates to the Streamlit spreadsheet component.  
  - **Explicit:** `mitosheet.streamlit.spreadsheet()` (or `from mitosheet.streamlit.v1 import spreadsheet`).
- **How it works:** Streamlit cannot use Jupyter comms. The **Streamlit component** uses two parts: (1) an invisible **message passer** component that receives postMessage from the Mito iframe and forwards to Python via `setComponentValue`, and (2) the **Mito iframe** that runs the same React frontend. On each script rerun, the Python side reads the message passer’s value, calls `mito_backend.receive_message(msg)`, and passes updated state (and responses) back via component args. So the same `MitoBackend` is used; the transport is Streamlit’s component value round-trip.
- **Detection:** `is_streamlit()` checks `streamlit.runtime.scriptrunner.get_script_run_ctx()`.

## 5. Dash

- **Entry point:** You must add the **Spreadsheet** component to your app layout and call **activate_mito(app)** so Mito registers its callbacks. You cannot use `mitosheet.sheet()` in Dash because the component must be part of the layout tree with a proper `id` dict.
- **How it works:** The Dash **Spreadsheet** component is a Dash component that loads the same Mito frontend bundle. User actions in the frontend trigger Dash **callbacks** (using the `@mito_callback` decorator), which call into `MitoBackend.receive_message()`. Results are passed back via component props. Backend instances are stored keyed by session/id so multiple spreadsheets and message ordering work correctly.
- **Detection:** `is_dash()` checks for the presence of the Dash app and its routes (e.g. `/_dash-dependencies`).
- **Build:** Dash bundle is built with `jlpm run build:dash` into `mitosheet/mito_dash/v1/mitoBuild/`. The package’s `_js_dist` and `_css_dist` in `__init__.py` point to these files so Dash can serve them.

## Not supported

- **Google Colab:** Colab does not support the Jupyter kernel comm in the way we need for the Mito frontend, so `sheet()` raises with instructions. Use JupyterLab, VSCode, Databricks, Streamlit, or Dash instead.

## Architecture overview

- **Backend:** `mitosheet/mito_backend.py` — `MitoBackend` holds state (`StepsManager`), handles `edit_event` and `update_event`, and exposes `receive_message(content)` and `mito_send(data)`.
- **Transport:**  
  - JupyterLab / VSCode / Databricks: `mito_send` = `comm.send`; frontend gets `getCommSend(kernel_id, comm_target_id)`.  
  - Streamlit: `mito_send` is not used directly; messages go component → script → `receive_message`; responses go back via component state.  
  - Dash: same idea with Dash callbacks and component props.
- **Frontend:** Single React app in `src/`. It gets a `getSendFunction()` that resolves to the right transport (comm, Streamlit wrapper’s `send`, or Dash wrapper’s `send`). The same `MitoAPI` and UI run in all environments.

This design keeps one spreadsheet implementation while remaining compatible with JupyterLab, VSCode, Databricks, Streamlit, and Dash.
