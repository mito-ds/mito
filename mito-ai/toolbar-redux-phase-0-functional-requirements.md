# Toolbar Redux — Phase 0 Functional Requirements

**Companion files:**
- `Toolbar Spec.md` (design spec — visual reference)
- `notebook-toolbar-modes-one-pager.md` (functional one-pager)
- `toolbar-redux-phase-0-research.md` (host-surface + registry research)

This doc is the **engineering source of truth** for what the toolbar must do. Where it disagrees with the design spec, this doc wins (the spec is treated as visual reference; this doc captures decisions that have been made or amended after handoff).

---

## 0. Scope

Build a single 52px-tall horizontal toolbar that sits below JupyterLab's menu bar and replaces Mito's existing per-notebook mode toolbar (`ModeToolbarWidget` + per-toolbar `NotebookViewModeSwitcher` injection).

**In scope (this work):**
- Lab-shell-level toolbar widget, full window width
- Mode switcher (Notebook / Document / App)
- Notebook mode right cluster: Mito controls + third-party extension buttons + hero Run action
- Document mode right cluster: passive meta line
- App mode right cluster: Edit App menu + Deploy
- Compatibility with third-party extensions that register Notebook toolbar items via JupyterLab's standard schema mechanism

**Out of scope (deferred / fast-follow):**
- Tab dropdown (left cluster) — see FR-410
- Replacing JupyterLab's native tab strip
- Per-tab mode persistence across page reloads
- Dark theme
- Jupyter Notebook 7 support (Lab only for v1)
- Mirroring legacy extensions that bypass the registry and inject directly into `panel.toolbar` DOM

---

## 1. Toolbar shell

### FR-100 — Host surface
The toolbar MUST be implemented as a JupyterLab-shell-level widget mounted in the `top` shell area at `rank: 150`, so it spans the full window width (across left sidebar, main area, right sidebar) and sits directly below the menu bar (rank 100).

### FR-101 — Replaces existing mode toolbar surfaces
The current per-notebook mode UI MUST be removed:
- `ModeToolbarWidget` insertion into `notebookPanel.contentHeader`
- `NotebookViewModeSwitcher` injection into `notebookPanel.toolbar`
- The native `notebookPanel.toolbar` MUST be hidden (e.g., `panel.toolbar.hide()`) since its items will be mirrored into the new toolbar

### FR-102 — Dimensions and structure
- Toolbar row height: **52px**
- Three clusters: **left**, **center**, **right**
- Center cluster MUST be absolutely positioned (`position: absolute; left: 50%; transform: translateX(-50%)`) so it does not shift horizontally when the right cluster's content changes (mode switch, button add/remove, viewport resize)
- Left cluster offset: 14px from left edge
- Right cluster offset: 14px from right edge
- Cluster button-to-button gap: 8px
- All visual tokens (colors, radii, shadows, type) per `Toolbar Spec.md` §2 and §9

### FR-103 — Always visible
The toolbar MUST be visible whenever JupyterLab is in multi-document mode and at least one document is open. Behavior in single-document mode and with zero documents open is defined in FR-110/111.

### FR-110 — Empty state (zero notebooks open)
When no notebook is the active widget:
- Left cluster: empty (placeholder UX deferred until Phase 5 when tab dropdown is built)
- Center cluster: mode switcher visible but disabled, defaulted to Notebook
- Right cluster: empty
- The toolbar itself MUST remain visible (not collapse)

### FR-111 — Non-notebook active widget (e.g., Python file, terminal)
When the active widget is not a `NotebookPanel`:
- Mode switcher visible but disabled
- Right cluster empty
- Toolbar remains visible

---

## 2. Mode system

### FR-200 — Three modes
The system supports exactly three modes: `'Notebook'`, `'Document'`, `'App'`.

### FR-201 — Default mode
Newly opened or activated notebooks MUST default to **Notebook** mode.

### FR-202 — Mode is per-active-notebook, in-memory only
Mode state lives in memory for the duration of the JupyterLab session. It MUST NOT be persisted across page reloads.

### FR-203 — Tab switch resets mode
When the user switches the active notebook (via Lab's tab strip, command palette, or any other mechanism), the newly-active notebook's mode MUST reset to **Notebook**, regardless of what mode that notebook (or the previously-active notebook) was in.

> **Amends spec §3 ("Per-tab mode memory").** The spec says "switching to a different open notebook restores its last mode." We have decided NOT to implement that. Default-to-Notebook on tab switch is simpler and avoids surprising mode states.

### FR-204 — Mode switcher input
The center-cluster mode switcher MUST:
- Display three options (Notebook, Document, App) as a segmented control with 16px icon + label per item, per spec §3
- Reflect the current mode of the active notebook
- On click of a non-active option, set the active notebook's mode to that option
- Support keyboard navigation: `ArrowLeft` / `ArrowRight` cycle modes when the switcher has focus
- Use `role="tablist"` with three `role="tab"` items and `aria-selected`

### FR-205 — Mode-driven content visibility
When mode is **Document**:
- Code cell inputs are hidden (existing `DocumentMode.css` rule)
- Outputs of collapsed cells are auto-expanded on entry (existing behavior)
- Native notebook toolbar stays hidden (per FR-101)

When mode is **App**:
- Notebook canvas is hidden
- Streamlit app preview is shown (existing `AppPreview` widget)
- Native notebook toolbar stays hidden

When mode is **Notebook**:
- Standard notebook canvas is visible
- Native notebook toolbar stays hidden (its items appear in the new toolbar's right cluster instead — see FR-300)

### FR-206 — Reuse existing mode infrastructure
The existing `NotebookViewModeManager` service (`INotebookViewMode` token) MUST be reused for mode state and signals. Internal data structure MAY be simplified (the `Map<panel.id, mode>` is no longer needed since mode resets to Notebook on tab change, per FR-203 — a single "current mode" field driven by `currentChanged` is sufficient).

---

## 3. Notebook mode — right cluster

### FR-300 — Cluster layout (left to right)
```
[+] [Code ▾] [ext1] [ext2] … [extN]  │  [▶ Run Active Cell │ ▾]
 │     │       └────────┬────────┘   │           │
 │     │                │             │           └─ hero action (Mito-owned, always rightmost)
 │     │                │             └─ vertical divider, 1px × 18px
 │     │                └─ third-party extension buttons (registry-driven, see FR-310)
 │     └─ cell-type picker (Code / Markdown / Raw)
 └─ add cell below (icon ghost button)
```

Order is fixed: Mito's add-cell + cell-type picker first, then extension buttons, then divider, then Mito's hero Run action last.

### FR-301 — Add cell button
- Icon-only ghost button, 32×32px
- Action: insert a new code cell below the active cell
- Tooltip: "Add cell below"
- `aria-label`: "Add cell below"

### FR-302 — Cell-type picker
- Ghost button with caret, label reflects current active cell's type (`Code`, `Markdown`, `Raw`)
- Click opens a small menu with the three types
- Selecting a type changes the active cell's type via Lab's existing command (`notebook:change-cell-to-code`, etc.)

### FR-303 — Run Active Cell (hero action)
The existing `RunCellButton` component (`src/components/RunCellButton.tsx`) MUST be reused. Functionality is already implemented:
- Split caret: left zone runs current cell, right zone opens dropdown
- Dropdown items: Run Current Cell, Run All, Restart and Run All, Restart, Stop (kernel-state-dependent), Clear All Outputs
- Live execution-state tracking via `iopubMessage` and `statusChanged` signals
- "Running Cells" state with loading indicator

**Required visual updates per spec §5:**
- Brand purple fill (`#4c1d95`)
- White text and icon
- 1px white-at-18%-opacity seam between left and right zones
- 32px tall, 7px radius
- Hover/pressed/focus states per spec §8.5

### FR-310 — Third-party extension buttons (registry bridge)
The right cluster MUST display toolbar items that third-party JupyterLab extensions register against the `Notebook` factory via the standard schema mechanism (`jupyter.lab.toolbars.Notebook` in their plugin schema), as documented in `toolbar-redux-phase-0-research.md` §2.

Implementation requirements:
- Use `createToolbarFactory(toolbarRegistry, settingsRegistry, 'Notebook', 'mito-ai:toolbar', translator)` to obtain the observable item list
- Use **our own** `pluginId` (`mito-ai:toolbar`) — NOT `@jupyterlab/notebook-extension:tracker` (transform collision; see research doc §2.4)
- Add `"jupyter.lab.transform": true` and `"toolbar": []` to the corresponding mito-ai schema file
- Render items inline (not in a "more" dropdown by default) in the position shown in FR-300
- Re-bind the factory to the active `NotebookPanel` on `notebookTracker.currentChanged` (factory-typed items like `kernelName` and `cellType` are panel-specific)

### FR-311 — Extension button visibility per mode
Extension buttons render **only in Notebook mode**. They MUST be hidden in Document and App modes.

### FR-312 — Overflow handling
When the right cluster's available width is insufficient to display all items inline:
- Items MUST collapse into a trailing `…` (overflow) menu
- Implementation: `ResizeObserver` on the cluster
- Fold order (first-to-fold → last-to-fold): extension buttons → Mito add-cell + cell-type picker → Mito hero action
- The hero Run action is the last to fold — it must remain visible whenever physically possible
- Keyboard-accessible: focus-visible on the overflow trigger, items navigable with arrow keys when open

### FR-313 — Legacy extensions (known limitation)
Extensions that register toolbar items by imperatively calling `panel.toolbar.insertItem(...)` from a `DocumentRegistry.WidgetExtension` will NOT appear in the new toolbar. This is a documented v1 limitation. We MAY revisit if a high-priority customer extension is affected (see research doc §6, risk #1).

---

## 4. Document mode — right cluster

### FR-400 — No buttons
Document mode right cluster MUST NOT render any action buttons. Mito's controls hide; extension buttons hide (per FR-311).

### FR-401 — Last-edited meta line
A single right-aligned passive text: "Last edited N min ago"
- 12px, color `#9a9aa6` (faint), system font
- Updates live as the user edits; debounce 5s
- No icon, no border, no background
- Source of "last edited": notebook context's dirty / save signals

### FR-410 — Tab dropdown (left cluster) — DEFERRED
The tab dropdown (search, pinned/today/earlier groups, ⌘K shortcut, dirty dots, close buttons, "+ New File" → Launcher) described in spec §4 is **deferred to a fast-follow effort**. The left cluster in v1 MAY render a simplified placeholder showing the active notebook's filename and a dirty dot, OR remain empty. Final v1 left-cluster contents are a Phase 1 design decision.

---

## 5. App mode — right cluster

### FR-500 — Cluster layout
```
[✦ Edit App ▾]  │  [🚀 Deploy App]   ← when deploy capability is enabled
[✦ Edit App ▾]                       ← when deploy capability is disabled
```

Extension buttons are hidden (per FR-311).

### FR-501 — Edit App menu
Reuse the existing `UpdateAppDropdown` component (`src/Extensions/AppPreview/UpdateAppDropdown.tsx`). Underlying actions (open AI taskpane, view source code, recreate from notebook) already work.

**Required visual updates per spec §7:**
- Trigger: outline button (`#ffffff` background, 1px `#dcdce3` border, ink text), 32px tall, 7px radius
- Sparkles icon leading in brand purple
- Caret trailing in mute color at 70% opacity
- Whole button opens the menu (no split-caret)
- Menu: 300px wide, two-line rows (bold title + 11.5px sub-line description)

**Menu items (in order):**
1. **Edit with AI** — title + sub "Describe a change in the AI taskpane." + `⌘ E` keyboard hint. Opens the AI taskpane.
2. **View source code** — title + sub "Open the generated app code to read or edit by hand." Opens the generated app source file.
3. (divider)
4. **Recreate from notebook** — title + sub "Regenerate the app from the current notebook. Discards manual edits." Amber refresh icon. Triggers regeneration.

### FR-502 — Recreate from notebook confirmation
The existing confirmation dialog in `AppPreview/utils.ts:81-95` MUST be retained.

> **Amends spec §7 ("Recreate from notebook — destructive").** The spec says "No confirmation modal at v1." We are NOT removing the existing confirmation. Keeping it preserves established safety behavior.

### FR-503 — `⌘ E` shortcut
When the active notebook is in **App mode**, `⌘ E` (Cmd+E on macOS, Ctrl+E on Windows/Linux) MUST trigger "Edit with AI" directly without opening the menu. The shortcut is scoped to App mode only.

### FR-504 — Deploy App button
- Filled primary, brand color, rocket icon, label "Deploy App"
- 32px tall, 7px radius
- Action: triggers the existing deploy flow
- **Conditional rendering**: only render when the deploy capability is enabled for the workspace. Hide entirely when disabled (do not render a disabled state)
- Reuse the existing beta-gating mechanism

---

## 6. Cross-cutting requirements

### FR-600 — Reuse Lab commands
Run / kernel / cell-type / clear-outputs actions MUST dispatch to JupyterLab's existing commands (`notebook:run-cell`, `notebook:run-all-cells`, `notebookmenu:restart-and-run-all`, `kernelmenu:restart`, `kernelmenu:interrupt`, `notebook:clear-all-cell-outputs`, etc.) rather than re-implement. (`RunCellButton.tsx` already does this via `NotebookActions`.)

### FR-601 — Existing components to reuse
- `RunCellButton` (`src/components/RunCellButton.tsx`) — Notebook mode hero
- `NotebookViewModeSwitcher` (`src/Extensions/NotebookViewMode/NotebookViewModeSwitcher.tsx`) — center cluster (REQUIRES VISUAL RESKIN to segmented pill per spec §3)
- `UpdateAppDropdown` (`src/Extensions/AppPreview/UpdateAppDropdown.tsx`) — App mode Edit App menu
- `NotebookViewModeManager` / `INotebookViewMode` token — mode state service
- App preview infrastructure under `src/Extensions/AppPreview/`

### FR-602 — Existing components to remove/replace
- `ModeToolbarWidget` (per-notebook contentHeader widget) — remove
- The injection of `NotebookViewModeSwitcher` into `notebookPanel.toolbar` — remove

### FR-603 — Visual fidelity
All visual tokens (colors, radii, shadows, hover/pressed/focus states, type scale) MUST follow `Toolbar Spec.md` §2, §3, §8, §9, §10.

### FR-604 — Accessibility
- Visible focus rings on every interactive element when navigated by keyboard: 2px outline `#a78bfa`, 2px offset (per spec §8.5)
- Every icon-only button MUST have an `aria-label`
- Mode switcher: `role="tablist"` + `role="tab"` + `aria-selected` (per FR-204)
- Keyboard tab order: left cluster → mode switcher → right cluster (left to right) → hero action → overflow trigger if present
- Tab order MUST NOT enter the notebook canvas via toolbar tabbing

### FR-605 — Long filename truncation (when tab dropdown ships)
Display filenames MUST be capped at 24 characters with middle truncation, preserving the `.ipynb` extension. Tooltip on hover shows the full name. (Applies to FR-410's deferred tab dropdown; included here for completeness.)

---

## 7. Definition of done (testable criteria)

A new agent implementing this work MUST be able to demonstrate, in a running JupyterLab instance:

1. The new toolbar renders, full-width, below the menu bar, on every page load.
2. The mode switcher swaps modes for the active notebook; the center cluster does not shift horizontally between modes.
3. Switching to a different open notebook (via tab strip or command) lands in **Notebook** mode regardless of the previous tab's mode.
4. **Notebook mode**:
   - `[+]`, `Code ▾`, and `Run Active Cell` work and dispatch to Lab commands
   - At least one third-party extension's registered Notebook toolbar item (e.g., a test extension or `jupyterlab/extension-examples/toolbar-button`) appears between the cell-type picker and the divider
   - When the window is narrowed, items collapse into an overflow `…` menu in the documented fold order
5. **Document mode**:
   - All buttons hide
   - "Last edited N min ago" appears, updates as the user edits
   - Code cell inputs hide (existing behavior preserved)
6. **App mode**:
   - `Edit App ▾` opens a menu with the three documented rows
   - "Recreate from notebook" still shows the existing confirmation dialog
   - `Deploy App` appears only when the beta gate is enabled
   - `⌘ E` triggers Edit with AI without opening the menu
7. The native per-notebook toolbar is not visible.
8. `RunCellButton`'s "Stop" menu item is enabled only while the kernel is executing.
9. Visible focus rings on tabbing through every interactive element.
10. No regressions in: opening notebooks, saving, kernel restart, app preview rendering, AI chat surface.

---

## 8. Notes for the implementing agent

- Read `toolbar-redux-phase-0-research.md` first. It documents the chosen host-surface approach (Option E), the registry-bridge pattern, the `pluginId` collision risk, and a code sketch.
- The phase plan (Phase 0 → 6) is iterative. You do NOT need to ship every requirement in a single pass — but the architectural decisions in §1 (host surface, replacing existing surfaces) should be settled early since they gate everything else.
- When in doubt about visual styling, defer to `Toolbar Spec.md` and the hi-fi screenshots in `/Users/aarondiamond-reivich/Downloads/mito-notebook-toolbar/project/screenshots/`.
- When in doubt about behavior, this doc wins over the spec.
- Test against an installed third-party extension that registers via schema (e.g., one with a `jupyter.lab.toolbars.Notebook` entry) to validate FR-310 end-to-end. If none is installed, add a temporary test schema entry in mito-ai's own schema to simulate.
