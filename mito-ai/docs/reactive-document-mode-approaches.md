# Reactive document mode: approaches and design rationale

This note captures why classic Jupyter patterns break for “dashboard-like” document mode, how other systems behave, and why Mito is leaning toward **rerunning all cells strictly below the cell that owns the control the user changed**.

It is meant for future maintainers so we do not re-litigate the same options without context.

---

## Problem statement

In **Document mode**, code inputs are hidden and users interact with **ipywidgets** in outputs. When a control changes (e.g. start date), we want **plots, tables, and filters** to refresh.

**Naive solution:** `NotebookActions.runAll`.

**Why it fails:** The cell that **constructs** the widget runs again. It executes source like `DatePicker(value=...)` or `mo.ui.button(value=0, ...)`, creating a **new** model object. The kernel replaces the live object the user just edited, and the UI **snaps back** to initial values.

So any reactive strategy must avoid blindly re-executing the **defining** cell for the control that changed, or must keep that cell’s source and runtime state perfectly aligned (hard; see “patch source” below).

---

## Approach A — Standard ipywidgets (Jupyter / kernel-centric state)

**Mechanism:** Widget state lives in the **kernel** (traitlets). User interaction sends **comm** messages; the widget object’s `.value` updates **without** re-running the cell that created it.

**Downstream refresh:** Not automatic. Authors use `.observe()`, `link()`, or an **extension** that listens to comm / execution and runs other cells.

**Why we do not rely on this alone for Document mode:** We still need a **policy** for *which* cells to run. “Run everything except tagged cells” or “run everything below cell *i*” is that policy; ipywidgets does not pick it for us.

**Strength:** Matches how Jupyter actually works; no file rewriting.

**Weakness:** Notebooks that snapshot `x = picker.value` once never see updates unless downstream code reads `picker.value` or observers sync variables.

---

## Approach B — Marimo-style reactive graph (variable-level DAG)

**Mechanism:** Marimo **statically analyzes** each cell for global **definitions** vs **references**, builds a **DAG**, and when a variable changes (including via `mo.ui.*`), runs cells that **reference** but do not **define** that variable. The **defining** cell for a UI object is **not** re-run on interaction ([interactivity rule](https://docs.marimo.io/guides/interactivity/)).

**Strength:** Precise for “real” dependencies; order is not strictly top-to-bottom.

**Weakness (important):** If a **single** cell both **reads** an upstream control **and defines another** control, that cell is a **dependent** of the first control. When the first control changes, Marimo **re-runs that whole cell**, which **re-executes** `button2 = mo.ui.button(value=0, ...)` and **resets** the second button. A concrete notebook demonstrated this: increment `button2`, then increment `button`; `button2.value` returns to `0` because the cell that defines `button2` was rerun as a downstream reaction to `button`.

So Marimo does **not** magically avoid “rerun resets widget” for **nested** UI defined in cells that are still in the reactive closure of an upstream interaction. The fix is structural (split cells, avoid defining persistent UI in cells that will rerun as dependents), not purely “reactive graph = solved.”

**Why we are not implementing a full Marimo-style graph in Mito (for now):** Building a correct static dependency graph on arbitrary `.ipynb` Python is a large product; Jupyter’s execution model is intentionally more flexible. We want a **simple** rule that works with linear notebooks and is explainable to users.

---

## Approach C — Papermill (batch parameters, full run)

**Mechanism:** Inject parameters (often via a tagged **`parameters`** cell) and execute the notebook as a **batch** pipeline; output is a new artifact.

**Strength:** Great for scheduled reports and CI: “same notebook, new `start_date`.”

**Weakness:** Not an **interactive** loop inside JupyterLab while the user drags a slider. It does not listen to ipywidget comms for incremental refresh.

**How we still use Papermill mentally:** The **`parameters`** tag is a familiar convention for “inputs live here,” but Papermill itself does not solve live Document mode.

---

## Approach D — Patch literal values in notebook source, then `runAll`

**Mechanism:** On widget change, rewrite the cell’s **text** (e.g. AST replace `DatePicker(value='old')` → `'new'`), then `runAll` so kernel and file agree.

**Strength:** `runAll` stays a single primitive; reproducibility **if** the patch is always correct.

**Weakness:** Fragile mapping from live widget to AST nodes; non-literal constructors; side effects in the same cell; merge conflicts; identity of outputs vs. text. High engineering and UX risk.

**Why we rejected this as the primary path:** Too brittle for general notebooks; Marimo does not do this for each slider drag either.

---

## Approach E — Tag-based exclusion + `NotebookActions.runCells` (complement of “control” cells)

**Mechanism:** Tag cells that only define controls (e.g. `mito-document-controls`); on refresh, run **all other** cells in order with `NotebookActions.runCells`.

**Strength:** Explicit; authors opt in; Papermill-aligned tag optional.

**Weakness:** Tax on authors (forget tag → broken or dangerous refresh); “which cells to run” is disconnected from **where** the interaction happened (always almost full notebook minus tags).

**Why we are moving away from this for v1:** The team prefers a **positional** rule that does not require tagging every dashboard notebook, at the cost of stricter **cell ordering** assumptions (see below).

---

## Approach F — Run all cells **strictly below** the cell that owns the changed control (Mito direction)

**Mechanism:**

1. When the user changes an ipywidget in Document mode, determine the **origin notebook cell**: the code cell whose **output area** contains that widget (same kernel session).
2. Rerun **every cell with index greater than that origin index** (markdown + code), in order.
3. **Do not** re-execute the origin cell, so constructors in that cell are not re-run and **that** widget’s state is preserved.

**Implementation note:** JupyterLab exposes **`NotebookActions.runAllBelow`**, which runs all cells **below the active cell**. That is awkward if we do not want to flash the active cell. Prefer a small helper that builds `notebook.widgets.slice(originIndex + 1)` and calls **`NotebookActions.runCells(notebook, thoseCells, sessionContext)`** ([API](https://jupyterlab.readthedocs.io/en/stable/api/functions/notebook.NotebookActions.runCells.html)), so we never depend on mutating the active cell for correctness.

**Why we chose this:**

- **No cell tags required** for the common case: “controls at the top, analysis below.”
- **Rule matches user mental model:** “Changing something up top refreshes everything under it.”
- **Same class of limitation as Marimo’s graph:** Any **downstream** cell that **defines another** interactive widget will **still** rerun when an **upstream** control in a **higher** cell changes, and that downstream defining cell will **reset** those nested widgets (same as the Marimo `button` / `button2` example if both are “below” the first button’s cell). We accept documenting this and recommending layout: put **all** long-lived controls in early cells; cells below should mostly **consume** widget state (`picker.value`) rather than create new persistent sliders—**or** accept resets for nested UI in the same vertical band.
- **Simpler than a DAG** for a JupyterLab extension on `.ipynb`.

**When graph / tags might return:** If we later need finer control, we can combine “run below origin” with tags (“never run this cell even if below”) or optional Marimo-like analysis.

---

## Summary table

| Approach | Preserves defining cell of *changed* control | Refreshes downstream | Authoring burden | Major caveat |
|----------|---------------------------------------------|----------------------|-------------------|--------------|
| ipywidgets alone | Yes | Manual / extension policy | Observers / patterns | Must read live widget state in downstream cells |
| Marimo DAG | Defining cell of interacted variable | Dependents | Unique defs, graph discipline | Cells that define *and* depend reset nested UI |
| Papermill | N/A (full batch) | Full run | Parameters cell | Not live Lab interaction |
| Patch source + runAll | If patch perfect | Full run | Fragile | AST / identity hell |
| Tags + runCells complement | Tagged cells skipped | All non-tagged | Tags on every control cell | Easy to misconfigure |
| **Run all below origin** | Origin cell skipped | All lower indices | **Order:** controls above, analysis below | Lower cells that *define* more widgets reset when upper controls change |

---

## Implementation (mito-ai)

Shipped behavior (see `documentReactiveRunner.ts`, `documentReactiveOrigin.ts`, `NotebookViewModePlugin.ts`):

- **Run slice:** `runAllCellsStrictlyBelow` in `notebook.tsx` calls `NotebookActions.runCells` on `notebook.widgets.slice(originIndex + 1)` without changing the active cell.
- **Origin from DOM:** capture-phase `pointerdown` / `change` / `input` / `click` on the notebook node; only when the event target lies inside a `.jp-OutputArea`; map the target to a cell via `findNotebookCellIndexContainingDomNode`.
- **Origin from comm:** shell-channel `comm_msg` with `direction === 'send'`; match `content.comm_id` to a code cell whose serialized outputs include `application/vnd.jupyter.widget-view+json` with the same `model_id` (ipywidgets convention).
- **Debounce:** 400 ms coalescing; **re-entrancy guard** skips scheduling while a reactive run is in progress.
- **Lifecycle:** runner is created in `_applyDocumentMode` and disposed when leaving Document/App mode, when the panel is disposed (if it still owns the runner), or when switching notebooks.

**Manual QA (JupyterLab):** open a notebook with a control in an early cell and plots below; enter Document mode; change the control; confirm downstream updates and that the control does not reset. Re-run after kernel restart.

---

## References

- Marimo reactivity: https://docs.marimo.io/guides/reactivity/
- Marimo interactivity (which cells run): https://docs.marimo.io/guides/interactivity/
- JupyterLab `NotebookActions.runCells`: https://jupyterlab.readthedocs.io/en/stable/api/functions/notebook.NotebookActions.runCells.html
- JupyterLab `NotebookActions.runAllBelow`: https://jupyterlab.readthedocs.io/en/stable/api/functions/notebook.NotebookActions.runAllBelow.html
