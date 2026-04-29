# Toolbar Redux

A new 52px-tall horizontal toolbar that sits below JupyterLab's menu bar and replaces Mito's existing per-notebook mode toolbar. Mounted as a Lab-shell-level widget in the `top` area at `rank: 150`, full window width.

## Start here

If you're picking up this work, read in this order:

1. **`phase-plan.md`** — the six-phase sequencing. Tells you what to do first and why.
2. **`functional-requirements.md`** — what the toolbar must do (FR-IDs are the source of truth for behavior; this doc wins over `spec.md` where they disagree).
3. **`research.md`** — JupyterLab shell-area + `IToolbarWidgetRegistry` research. Includes a code sketch and the gotchas (`pluginId` collision, Notebook 7 incompatibility, legacy-extension limitations). Read this before writing any code.
4. **`spec.md`** — the visual design spec from the designer. Source of truth for colors, dimensions, hover states, type, and all visual tokens.
5. **`screenshots/`** — hi-fi mocks (`hifi-overview.jpg` for all five mode states; `edit-app-menu*.jpg` for the App-mode dropdown).
6. **`one-pager.md`** — the original functional one-pager from the designer. Useful background; superseded by `functional-requirements.md` for engineering decisions.

## Files

| File | Purpose |
|---|---|
| `README.md` | This file — index and start-here pointer |
| `phase-plan.md` | Phase-by-phase scope, rationale, definition of done |
| `functional-requirements.md` | Engineering source of truth for behavior (FR-IDs) |
| `research.md` | Lab-shell + `IToolbarWidgetRegistry` research with code sketch |
| `spec.md` | Visual design spec |
| `one-pager.md` | Original designer one-pager (background) |
| `screenshots/` | Hi-fi mocks |

## Decisions that amend the design spec

These are documented in `functional-requirements.md` but flagged here because they're easy to miss when reading the spec in isolation:

- **Tab switch always resets to Notebook mode** (FR-203). Spec said "restore last mode"; we don't.
- **Mode is in-memory only** (FR-202). No persistence across page reloads.
- **Recreate-from-notebook keeps its confirmation dialog** (FR-502). Spec said no modal; we keep the existing one.
- **Tab dropdown is deferred** (FR-410, Phase 5). Not gating v1.
- **Notebook 7 is out of scope** for v1 — the `top` area is not full-width there (`research.md` §1.4).
- **Legacy extensions that imperatively call `panel.toolbar.insertItem(...)` are invisible to the new toolbar** (FR-313). Known v1 limitation.
- **Extension button placement**: in Notebook mode, third-party schema-registered toolbar items render between Mito's `[Code ▾]` cell-type picker and the divider — not in a "spillover" cluster (FR-300). Hidden in Document and App modes (FR-311).

## Key technical constraint

Use `pluginId = 'mito-ai:toolbar'` (or your package-namespaced equivalent) when calling `createToolbarFactory`. **Never reuse `@jupyterlab/notebook-extension:tracker`** — that triggers a transform collision that silently disables live plugin reloads. See `research.md` §2.4.
