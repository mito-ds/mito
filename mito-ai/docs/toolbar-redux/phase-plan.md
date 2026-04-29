# Toolbar Redux — Phase Plan

This document sequences the work into six phases. The order is **risk-first, testable-first**: the riskiest architectural unknowns and earliest verifiable milestones come first; cosmetic and nice-to-have items come last. Each phase has a **scope**, a **rationale** (why it's at this position in the sequence), and a **definition of done**.

**Companion files (in this folder):**
- `functional-requirements.md` — what to build (FR-IDs referenced throughout this doc)
- `research.md` — Lab-shell + `IToolbarWidgetRegistry` research (read this first)
- `spec.md` — visual reference (colors, dimensions, hover states, type)
- `screenshots/` — hi-fi mocks
- `one-pager.md` — original functional one-pager (kept for context)

---

## Phase ordering at a glance

| Phase | Scope | Risk | Why now |
|---|---|---|---|
| **0** | Lab-shell host + registry bridge + structural skeleton | High | Largest architectural unknown; gates everything |
| **1** | Mode switcher visual reskin + integration polish | Low | First testable visual milestone; shared by every mode |
| **2** | Notebook mode right cluster | Medium | The most-used mode; most existing reuse opportunity |
| **3** | App mode right cluster | Low | Existing components, mostly reskin |
| **4** | Document mode meta line | Trivial | Tiny scope; dependency-free |
| **5** | Tab dropdown (left cluster) | Medium | Largest *new* surface area; not gating; deferred unless prioritized |
| **6** | A11y + overflow + polish | Low | Cross-cutting; sweep at the end |

**Phase 0 = "spike + scaffold"**, **Phases 1–4 = v1 of the toolbar**, **Phase 5 = optional**, **Phase 6 = polish to ship-quality**.

---

## Phase 0 — Foundation: Lab-shell host + registry bridge

### Scope
- Create `MitoToolbarPlugin` mounted in JupyterLab's `top` shell area at `rank: 150` (FR-100).
- Build the toolbar widget with three clusters (left / center / right) and the absolutely-positioned center cluster (FR-102).
- Wire the `IToolbarWidgetRegistry` bridge: `createToolbarFactory(reg, settings, 'Notebook', 'mito-ai:toolbar', translator)` so third-party schema-registered Notebook toolbar items appear in the right cluster (FR-310).
- Add the schema file with `"jupyter.lab.transform": true` and `"toolbar": []` (per `research.md` §2.4).
- Remove the existing per-notebook surfaces: `ModeToolbarWidget` from `panel.contentHeader`, `NotebookViewModeSwitcher` injection into `panel.toolbar`. Hide `panel.toolbar` (FR-101, FR-602).
- Migrate existing components into the new toolbar **as-is, no visual changes**:
  - Mode switcher (`NotebookViewModeSwitcher`) into the center cluster (still using its current underline-tab visual; reskin in Phase 1).
  - `RunCellButton` into the right cluster as the Notebook-mode hero.
  - `UpdateAppDropdown` + Recreate / Deploy buttons into the right cluster as App-mode actions.
- Implement tab-switch-resets-to-Notebook (FR-203). Simplify `NotebookViewModeManager` by dropping the per-panel mode `Map`.

### Explicitly NOT in Phase 0
- Visual reskin of the mode switcher (still tab-style underline)
- Brand-purple Run button styling
- `[+]` add-cell button
- `[Code ▾]` cell-type picker
- "Last edited N min ago" meta line
- Tab dropdown
- Overflow `…` menu / ResizeObserver
- Empty-state polish (FR-110/111)
- Final keyboard nav order, focus rings

### Rationale
This is the largest architectural unknown. Lab-shell mounting + the registry bridge could fail in subtle ways (transform collisions, item-list lifecycle, single-doc-mode behavior). Until this is proven, no other phase can ship. The phase intentionally avoids visual work so we can validate the host surface decoupled from the cosmetics.

### Definition of done
1. New toolbar renders, full window width, below the menu bar, on every page load.
2. Mode switcher in the new toolbar swaps modes for the active notebook.
3. Tab change resets the new active panel to Notebook mode.
4. Native `panel.toolbar` is hidden — its items don't render twice.
5. The old `ModeToolbarWidget` and the injected switcher are gone (no per-notebook mode UI surfaces remain).
6. **A schema-registered Notebook toolbar item appears in the new toolbar's right cluster** (validate by adding a temporary `clear-all-outputs` entry to `schema/toolbar.json`'s `jupyter.lab.toolbars.Notebook` array, or by installing `jupyterlab/extension-examples/toolbar-button`).
7. `RunCellButton` works in Notebook mode; `Edit App` / `Recreate` / `Deploy` work in App mode.
8. `jlpm build` and `jlpm eslint` pass.

### Known risks for Phase 0
- **Centering may not work as written.** First-party precedent (`application-extension:top-bar`) confirms `top` is full-width, but `position: absolute; left: 50%` interacts with Lumino's panel layout; if the center cluster ends up right-aligned, expect a CSS or panel-structure fix.
- **Transform collision** on `pluginId`. Use `mito-ai:toolbar`, NEVER `@jupyterlab/notebook-extension:tracker`. `research.md` §2.4 explains.
- **Single-doc mode** relocates the menu bar out of `top` (`shell.ts:482`). Verify the toolbar still renders sensibly there.
- **Legacy extensions** that imperatively call `panel.toolbar.insertItem(...)` won't appear (FR-313). This is a known v1 limitation, not a Phase 0 blocker.

---

## Phase 1 — Mode switcher reskin + integration polish

### Scope
- Reskin `NotebookViewModeSwitcher` from the underline-tab visual to the **segmented pill** described in `spec.md` §3:
  - Container `#fafafb` bg, 1px `#ececf0` border, 8px radius
  - Active item: white bg, brand purple text (`#4c1d95`), 1-2px shadow + brand border
  - Inactive: transparent, mute text (`#6b6b78`)
  - 32px tall, inner items 26px tall
  - Keyboard: `ArrowLeft` / `ArrowRight` cycle (FR-204)
  - `role="tablist"` + `role="tab"` + `aria-selected`
- Resolve any centering / layout bugs that came out of Phase 0 verification.
- Implement empty-state behavior (FR-110, FR-111):
  - Mode switcher visible but disabled when no notebook is active or when active widget is non-notebook.
  - Toolbar remains visible.

### Rationale
The mode switcher is the most prominent visual element in the toolbar and is the primary "feel" test. Getting it right early surfaces token / styling issues before they multiply into right-cluster work. This is also the smallest possible cosmetic change that delivers a perceptible quality bump — a good first delivery.

### Definition of done
1. Mode switcher matches `spec.md` §3 visually at parity with `screenshots/hifi-overview.jpg`.
2. Center cluster is centered horizontally regardless of right-cluster width — verified by switching modes and resizing the window.
3. Keyboard navigation works (`ArrowLeft`/`ArrowRight`).
4. Empty / non-notebook states handled.
5. Existing tests pass.

---

## Phase 2 — Notebook mode right cluster

### Scope
- Add `[+]` add-cell ghost button (FR-301):
  - Icon-only, 32×32, mute color, hover `#f5f5f7` bg
  - Action: insert new code cell below active cell
  - Tooltip + aria-label: "Add cell below"
- Add `[Code ▾]` cell-type picker (FR-302):
  - Ghost button with caret, label reflects active cell's type
  - Click opens menu: Code / Markdown / Raw
  - Dispatch existing Lab commands (`notebook:change-cell-to-code`, etc.)
- Add the vertical divider between extension-button area and the hero (1px × 18px, `#ececf0`, 6px horizontal margin).
- **Restyle `RunCellButton`** per `spec.md` §5:
  - Brand purple fill (`#4c1d95`), white text and icon
  - 1px white-at-18%-opacity seam between left zone (run) and right zone (caret)
  - 32px tall, 7px radius
  - Hover / pressed / focus states per spec §8.5
- Confirm extension-button placement (FR-300): `[+] [Code ▾] [ext1]…[extN] │ [Run]` — extension buttons sit between cell-type picker and divider, hero anchored right.

### Rationale
Notebook is the most-used mode. Most underlying functionality already exists (`RunCellButton`'s split-caret + kernel-state tracking; Lab's cell-type commands), so this phase is mostly visual + small UI additions, not new behavior. Doing this before App-mode reskin (Phase 3) prioritizes the higher-traffic surface.

### Definition of done
1. All four right-cluster Mito controls render and work in Notebook mode.
2. `RunCellButton` matches the spec visually; "Stop" still gates on kernel-running state (FR-303).
3. Adding a schema-registered third-party toolbar item still places it correctly between cell-type picker and divider.
4. Cell-type picker reflects the active cell's type and updates when the user moves between cells.
5. Visual parity with `screenshots/hifi-overview.jpg` Notebook artboard.

---

## Phase 3 — App mode right cluster

### Scope
- Reskin `UpdateAppDropdown` per `spec.md` §7 (FR-501):
  - Trigger: outline button, sparkles icon (brand purple), caret (mute @ 70%), 32px tall, 7px radius
  - Whole button opens menu (no split-caret, unlike Notebook hero)
  - Menu: 300px wide, white panel, 10px radius, 1px `#dcdce3` border
  - Two-line rows: bold title + 11.5px sub-line description
  - Three rows in order: Edit with AI / View source code / (divider) / Recreate from notebook (amber refresh icon)
- Restyle Deploy button as primary (`spec.md` §7, FR-504): brand fill, rocket icon, white label.
- Wire `⌘ E` keyboard shortcut: when in App mode, triggers "Edit with AI" directly (FR-503).
- Keep the existing recreate confirmation dialog (FR-502, amends spec).
- Beta gate for Deploy unchanged (existing mechanism).

### Rationale
App mode reuses three existing surfaces (`UpdateAppDropdown`, recreate confirmation, deploy beta gate). The work is mostly visual — adding the two-line row format, swapping icons, and styling the trigger. Lower risk than Phase 2 because there are fewer new pieces.

### Definition of done
1. Edit App trigger and menu match `screenshots/edit-app-menu.jpg` and `edit-app-menu-focus.jpg`.
2. All three menu items work and dispatch to existing actions.
3. Recreate still shows the existing confirmation dialog.
4. Deploy renders only when the beta gate is enabled.
5. `⌘ E` triggers Edit with AI in App mode.

---

## Phase 4 — Document mode meta line

### Scope
- Render "Last edited N min ago" right-aligned text in the right cluster when mode = Document (FR-401):
  - 12px, color `#9a9aa6` (faint), system font
  - No icon, no border, no background
  - Updates live as the user edits, debounce 5s
  - Source signal: notebook context's `dirty` / `save` events
- All buttons (Mito + extension) hidden in Document mode (FR-400, FR-311).

### Rationale
Trivial scope, completely independent of other phases. Done last among the v1 modes because there's nothing risky here and no one is blocked on it.

### Definition of done
1. "Last edited N min ago" appears in Document mode and updates as the user edits.
2. No buttons render in Document mode.
3. Existing Document-mode behaviors (cell inputs hidden, collapsed outputs expanded) preserved.

---

## Phase 5 — Tab dropdown (DEFERRED unless prioritized)

### Scope (only if undeferred)
- The tab dropdown described in `spec.md` §4 / FR-410:
  - Trigger pill in the left cluster: file icon + filename (monospace, 24-char middle truncation per FR-605) + dirty dot + open-count + ⌘K kbd hint
  - Open dropdown: 380px wide, search input (visual-only at v1), Pinned / Today / Earlier groups, footer "+ New File" → Launcher
  - ⌘K global shortcut to toggle
  - Per-row close button or dirty dot, time stamps, active-row highlight
- Underlying data: open-notebook tracking, last-opened timestamps, pin persistence.

### Rationale
This is the largest new subsystem in the spec but is **not** gating any other functionality. The toolbar is fully usable without it (FR-410 explicitly defers). Built last so we can ship v1 of the toolbar first and revisit the tab dropdown as a fast-follow if user research validates the open-rate / time-to-tab-switch metrics.

If undeferred, the placeholder for the left cluster in v1 may show the active notebook's filename and dirty dot only.

### Definition of done (if built)
- Matches `spec.md` §4 visually
- ⌘K opens from anywhere in the workspace
- Pinned state persists across reloads (uses `IStateDB`)
- Empty state ("No notebooks open") works

---

## Phase 6 — A11y, overflow, polish

### Scope
- ResizeObserver-driven overflow handling (FR-312):
  - When the right cluster doesn't fit, items collapse into a trailing `…` menu
  - Fold order: extension buttons first, then Mito add-cell + cell-type picker, then hero last
  - Keyboard-accessible
- Visible focus rings on every interactive element (FR-604): 2px `#a78bfa`, 2px offset
- `aria-label` on every icon-only button
- Final keyboard tab order pass: left → center → right → hero → overflow
- Tooltips per `spec.md` (Add cell, Edit App caret, mode-switcher items, etc.)
- Single-document mode visual regression sweep

### Rationale
All cross-cutting and not gating any feature. Done at the end so it's a single sweep against a stable surface, not a moving target.

### Definition of done
1. Overflow menu folds and unfolds correctly when window is resized.
2. Tabbing through the toolbar shows visible focus rings on every control.
3. Every icon-only button has an `aria-label`.
4. Keyboard tab order matches the spec.
5. Single-document mode renders the toolbar without visual regression.

---

## What "v1 done" looks like

Phases 0–4 + 6 ship **v1**. Phase 5 is the fast-follow.

A v1 release passes the FR-document's §7 "Definition of done" criteria — except item 4's overflow menu and item 5's "Last edited" line are gated on Phase 6 and Phase 4 respectively. All other DoD criteria are met.

---

## When to revisit phase ordering

Re-evaluate the ordering if any of the following happen during Phase 0:

- **The Lab-shell mount fails** (e.g., `top` doesn't span full width as the research doc claims for our specific Lab version). → Re-open the Option A vs. Option E decision; the research doc has the cost-benefit.
- **A high-priority customer extension uses imperative `panel.toolbar.insertItem(...)`** and is invisible to our registry bridge. → Add a `panel.toolbar` mirroring step (research doc §6 risk #1) — it's an extra ~100 lines but worth it if a real customer is affected.
- **Single-document mode visual regression is severe.** → Pull Phase 6's single-doc sweep forward into Phase 0.

Otherwise, follow the sequence above.
