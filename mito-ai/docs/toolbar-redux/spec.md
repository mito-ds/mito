# Mito Notebook Toolbar — Engineering Specification

**Status:** Approved for implementation
**Stage:** Design handoff
**Companion files:** `Mito Toolbar Hi-Fi.html` (5 artboards), `Design Review Brief.html`
**Last updated:** Apr 28, 2026

---

## 1. Overview

A single toolbar row sits below the preserved JupyterLab menu bar. It replaces both Lab's tab strip and Mito's previous mode-switching toolbar. The row has three clusters: a **tab dropdown trigger** on the left, a **centered mode switcher** (Notebook / Document / App), and **mode-specific actions** on the right.

The mode switcher is **absolutely centered** so it never shifts horizontally when the right cluster's contents change between modes.

### ASCII layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ● ● ●   localhost:8888/lab/...                                               │  ← browser chrome (OS)
├──────────────────────────────────────────────────────────────────────────────┤
│ File  Edit  View  Run  Kernel  Tabs  Settings  Help                          │  ← JupyterLab menu bar (preserved)
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ [📄 Untitled37.ipynb • · 4   ⌘K  ▾]    [ Notebook  Document  App ]    {right}│  ← Mito toolbar (new)
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
                  ↑                              ↑                       ↑
            tab dropdown               mode switcher            mode-specific
            trigger (left)             (absolutely centered)    actions (right)
```

### Right-cluster contents by mode

```
Notebook mode:
  …  [+]  [Code ▾]  │  [▶ Run Active Cell │ ▾]
                                    split-caret primary

Document mode:
  …  Last edited 2 min ago
                    quiet meta only — no buttons

App mode (deploy enabled):
  …  [✦ Edit App ▾]  │  [🚀 Deploy App]
                              primary

App mode (deploy disabled):
  …  [✦ Edit App ▾]
```

`│` = visual divider (1px line, see Tokens). `…` = flexible space.

---

## 2. Layout & dimensions

| Element | Spec |
|---|---|
| Toolbar row height | **52px** |
| Toolbar background | `#ffffff` (panel) |
| Toolbar bottom border | `1px solid #ececf0` (line) |
| Left-cluster offset | 14px from left edge |
| Right-cluster offset | 14px from right edge |
| Cluster gap (button-to-button) | 8px |
| Center anchor | `position: absolute; left: 50%; transform: translateX(-50%)` |
| Standard control height | **32px** (trigger, buttons, mode switcher all match) |
| Standard border-radius | 7px (buttons), 8px (mode switcher container), 5–6px (inner pills, menu rows) |

**Critical:** the centered mode switcher must be absolutely positioned, not flex-centered. Right-cluster width changes (Notebook → App, Deploy on/off) must not cause it to shift.

---

## 3. Mode switcher (center)

A segmented control with three options: Notebook, Document, App. Each shows a 16px icon + label.

### Visual

| State | Background | Text color | Border / shadow |
|---|---|---|---|
| Container | `#fafafb` (bg) | — | `1px solid #ececf0` |
| Inactive item | transparent | `#6b6b78` (mute) | none |
| Active item | `#ffffff` | `#4c1d95` (brand) | `0 1px 2px rgba(15,18,30,0.06), 0 0 0 1px rgba(76,29,149,0.10)` |

- Container: 32px tall, 2px inner padding, 8px radius.
- Inner items: 26px tall, 5px radius, 12px horizontal padding, 6px gap between icon and label.
- Active label: weight 600. Inactive: weight 500.

### Behavior

- Per-tab mode memory: switching to a different open notebook restores its last mode.
- Always visible across all modes (no mode hides the switcher).
- Click switches mode; no caret, no menu.
- Keyboard: arrow-left / arrow-right cycles modes when focus is on the switcher.

---

## 4. Tab dropdown (left)

### Trigger (closed state)

A 32px-tall pill that displays the active notebook + open count + ⌘K hint + caret.

```
[📄 Untitled37.ipynb •  · 4   ⌘K  ▾]
 │   │                 │   │   │   └── caret (faint)
 │   │                 │   │   └────── kbd hint, faint, monospace
 │   │                 │   └────────── open-count, "· N" in faint
 │   │                 └────────────── dirty dot (only if unsaved)
 │   └─────────────────────────────── filename (monospace)
 └─────────────────────────────────── file icon (faint)
```

**Tokens:**
- Background: `#ffffff` (idle), `#f5f5f7` (pressed/open)
- Border: `1px solid #ececf0` (idle), `1px solid #dcdce3` (pressed)
- Filename: JetBrains Mono, 12px, color `#1a1a24` (ink)
- Open-count `· N`: 12px, color `#9a9aa6` (faint)
- Kbd hint `⌘ K`: JetBrains Mono, 10.5px, color `#9a9aa6`, 1px border `#ececf0`, 4px radius, 1px×5px padding
- Internal gap: 8px

### Dirty indicator

- 6px solid amber dot, color `#b45309` (warn).
- **No halo** — flat dot only.
- Appears immediately to the right of the filename.
- Tooltip: "Unsaved changes".

### Keyboard

- `⌘ K` (Cmd+K on macOS, Ctrl+K on Windows/Linux) toggles the dropdown.
- Click on trigger toggles the dropdown.
- Arrow up/down navigates rows when open. `Enter` activates. `Esc` closes.

### Open dropdown menu

Anchored to the trigger's left edge, 6px below. **380px wide.** White panel, 1px `#dcdce3` border, 10px radius, shadow `0 16px 40px rgba(15,18,30,0.12), 0 2px 6px rgba(15,18,30,0.04)`. 6px inner padding.

**Structure (top to bottom):**

1. **Search input** (visual only at handoff — wired in v1.1):
   - "Search open notebooks" placeholder + search icon + ⌘K kbd hint on the right.
   - Filled `#fafafb`, 1px `#ececf0` border, 7px radius, 8–10px padding.
2. **Pinned** group (only renders if any pinned notebooks exist).
3. **Today** group (opened today, not pinned).
4. **Earlier** group (opened before today, not pinned).
5. **Divider** (1px, `#ececf0`, 4px horizontal margin).
6. **Footer action: "+ New File"**, `opens Launcher` hint on the right. This opens JupyterLab's built-in Launcher — it is **not** a file browser. (For file browsing the user uses the left rail's file tree.)

**Group header:** 10px, weight 600, letter-spacing 0.6px, uppercase, color `#9a9aa6` (faint), 6px top / 4px bottom / 12px horizontal padding.

**Row:** 8px vertical / 10px horizontal padding, 6px radius. Active row fills with `#ede9fe` (brandSoft); active filename uses `#4c1d95` (brand) at weight 600.

**Row contents (left → right):**
- Pin or file icon (color: brand if pinned, brand if active, faint otherwise).
- Filename (monospace, 12px, ink).
- Right-aligned: relative time ("now", "12 min ago", "Yesterday", "Apr 24") in 11px faint.
- Trailing slot: **× close button** if the file is clean, or the **amber dirty dot** if it has unsaved changes. The dot replaces the × until the file is saved — this is intentional; it's a redundant signal (color + glyph + position) that prevents accidental close-without-save.

### Empty state

When zero notebooks are open, the trigger should show "No notebooks open · ⌘K" and the dropdown opens directly to the "+ New File" footer (no group headers, no search). **Engineer to implement; not visualized in current artboards.**

### Long filename truncation

Cap displayed filename at **24 characters** with **middle truncation** so the `.ipynb` extension stays visible. Example: `customer-cohort-anal…ysis.ipynb`. Tooltip on hover shows the full name. **Engineer to implement; not visualized in current artboards.**

---

## 5. Notebook mode actions (right cluster)

```
[+]  [Code ▾]  │  [▶ Run Active Cell │ ▾]
```

### `[+]` Add cell

- Icon-only ghost button. 32×32px.
- Color `#6b6b78`, transparent background, transparent border.
- Hover: `#f5f5f7` background.
- Tooltip / SR label: "Add cell below".

### `[Code ▾]` Cell-type picker

- Ghost button with caret. Text: "Code".
- Opens a small menu on click: Code · Markdown · Raw.
- Reflects the active cell's type.

### Vertical divider

- 1px wide × 18px tall, color `#ececf0`, 6px horizontal margin.

### `[▶ Run Active Cell │ ▾]` Split-caret primary

This is the hero action of Notebook mode.

- **Filled primary** in brand color. See "Primary button" tokens below.
- **Two hit zones**, joined visually:
  - **Left zone:** play icon + "Run Active Cell" label. Click executes the active cell.
  - **Right zone:** caret only. Click opens menu.
  - Visual seam: 1px `rgba(255,255,255,0.18)` border between the two zones (white at low opacity over the brand fill).
- **Caret menu items** (in order):
  1. **Run Current Cell** — same as primary click; shown for menu completeness.
  2. **Run All Cells**
  3. **Restart and Run All**
  4. ─── divider ───
  5. **Restart Kernel**
  6. **Stop / Interrupt Kernel** — only enabled when something is executing.
  7. ─── divider ───
  8. **Clear All Outputs**

Items 5–6 are kernel-state-dependent (per the source one-pager). Disabled state: 50% opacity, no hover.

---

## 6. Document mode (right cluster)

**No action buttons.** The toolbar steps back so the document narrative reads.

A single quiet meta line is shown right-aligned in the cluster:

```
Last edited 2 min ago
```

- 12px, color `#9a9aa6` (faint), 6px horizontal padding, system font.
- The text updates live as the user edits (debounce 5s).
- No icon, no border, no background.

This line exists to keep the row from reading as "broken / missing buttons" — it's not load-bearing UI.

---

## 7. App mode actions (right cluster)

```
[✦ Edit App ▾]  │  [🚀 Deploy App]   ← deploy enabled
[✦ Edit App ▾]                       ← deploy disabled
```

### `[✦ Edit App ▾]` Outline button + caret

The whole button opens a menu — there is no default-action zone (it's not a split-caret).

- **Outline** kind: white background, 1px `#dcdce3` border, ink text, 12px horizontal padding.
- Sparkles icon (`✦`) leading, in brand purple `#4c1d95`.
- Caret trailing, in `#6b6b78` (mute) at 70% opacity.
- 32px tall, 7px radius.

### Edit App menu

Anchored to the trigger's right edge, 6px below. **300px wide.** White panel, 1px `#dcdce3` border, 10px radius, shadow `0 16px 40px rgba(15,18,30,0.12), 0 2px 6px rgba(15,18,30,0.04)`. 6px inner padding.

Each row is **two-line**: a bold action title and a 11.5px sub-line description. This makes each item unambiguous.

**Row 1 — Edit with AI**
- Icon: sparkles, brand purple `#4c1d95`
- Title: **Edit with AI**
- Sub: "Describe a change in the AI taskpane."
- Keyboard hint (right-aligned): `⌘ E`
- Action: opens the AI taskpane (existing surface).

**Row 2 — View source code**
- Icon: pencil, brand purple `#4c1d95`
- Title: **View source code**
- Sub: "Open the generated app code to read or edit by hand."
- No keyboard hint at v1.
- Action: opens the generated app's source file in a new editor tab.

**Divider** — 1px `#ececf0`, 4px horizontal / 4px vertical margin.

**Row 3 — Recreate from notebook** (destructive)
- Icon: refresh-circular, **amber `#b45309`** (the only place amber is used outside the dirty dot)
- Title: **Recreate from notebook**
- Sub: "Regenerate the app from the current notebook. Discards manual edits."
- No keyboard hint.
- Action: triggers app regeneration. **No confirmation modal at v1** — destructiveness is signaled by the divider, the amber icon, and the explicit "Discards manual edits" sub-line. If user research shows misclick rates above an acceptable threshold, promote to a confirmation modal in a fast-follow.

**Row visual:**
- Padding: 10px vertical, 12px horizontal, 6px radius.
- Title: 13px, weight 500, color `#1a1a24` (ink).
- Sub: 11.5px, color `#6b6b78` (mute), line-height 1.45, `text-wrap: pretty`.
- Icon-to-text gap: 12px. Icon top-margin 2px (aligns with title baseline).
- Hover: `#f5f5f7` (hover) background.

### Vertical divider (between Edit App and Deploy)

Same as the Notebook divider: 1px × 18px, `#ececf0`, 6px horizontal margin.

### `[🚀 Deploy App]` Primary button (conditional)

- Filled primary, brand color.
- Rocket icon leading, white. Label "Deploy App".
- 32px tall, 14px horizontal padding, 7px radius.
- **Conditional rendering:** only render when the deploy capability is enabled for the workspace. Hide entirely when disabled (do not show a disabled state — the mode switcher's existence already implies App mode is reachable; an inert Deploy button would be confusing).

---

## 8. Buttons & inputs — visual primitives

### Heights

All toolbar controls (trigger, mode switcher, ghost/outline/primary buttons, icon-only buttons) are **32px** tall. No exceptions.

### Variants

| Variant | Background | Border | Text | Padding | Use |
|---|---|---|---|---|---|
| **Ghost** | transparent | transparent | `#3b3b48` (body) | 0 10px | Tertiary actions ("Code ▾") |
| **Icon ghost** | transparent | transparent | `#6b6b78` (mute) | 32×32 square | Icon-only ("+") |
| **Outline** | `#ffffff` | 1px `#dcdce3` | `#1a1a24` (ink) | 0 12px | Secondary ("Edit App ▾") |
| **Primary** | `#4c1d95` (brand) | 1px `#4c1d95` | `#ffffff` | 0 14px | Hero action per mode (Run, Deploy) |

**Primary shadow:** `0 1px 0 rgba(76,29,149,0.20)`.

### Hover / pressed / focus

(Minimal — engineer to extend per platform conventions.)

| State | Ghost | Outline | Primary |
|---|---|---|---|
| Hover | bg → `#f5f5f7` | bg → `#fafafb` | bg → `#3d1376` (10% darker) |
| Pressed | bg → `#ececf0` | bg → `#f5f5f7` | bg → `#2e0a5b` (20% darker) |
| Focus-visible | 2px outline `#a78bfa` (brandLift), 2px offset | same | same, but offset clears the brand fill |
| Disabled | 50% opacity, no pointer events | same | same |

### Iconography

- All icons are 16px square (`viewBox="0 0 24 24"`), stroked at 1.6px, `currentColor` stroke.
- Icons in primary buttons are filled, white, no stroke.
- Mode-switcher icons match this size and stroke weight.

---

## 9. Color tokens (final)

Use exactly these. Do not introduce new accent colors — the palette is intentionally tight.

```
/* Surfaces */
--bg:           #fafafb   /* canvas, mode-switcher container, search field */
--panel:        #ffffff   /* toolbar, trigger, outline buttons, menus */
--hover:        #f5f5f7   /* hover/pressed for ghost surfaces */

/* Text */
--ink:          #1a1a24   /* primary text, filenames, titles */
--body:         #3b3b48   /* button labels (ghost) */
--mute:         #6b6b78   /* secondary text, inactive switcher items */
--faint:        #9a9aa6   /* tertiary, kbd hints, time stamps, "· N" */

/* Lines */
--line:         #ececf0   /* default 1px borders, dividers */
--lineStrong:   #dcdce3   /* outline-button border, menu border, pressed trigger */

/* Brand */
--brand:        #4c1d95   /* primary fill, active row text, brand icon, brand accent */
--brandDeep:    #1e0a38   /* reserved, currently unused */
--brandSoft:    #ede9fe   /* active row fill in dropdown */
--brandLift:    #a78bfa   /* focus rings */

/* Functional accent — single attention color */
--warn:         #b45309   /* dirty dot, "Recreate from notebook" icon */
--warnSoft:     #fef3c7   /* reserved, currently unused */
```

**Removed (do not use):** `--live` (#059669) and `--liveSoft` (#d1fae5). These were in the previous spec; pruning emerald keeps the system to **brand purple + amber** as the only chromatic accents. Everything else is tonal grey.

---

## 10. Type

```
--font-system: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
               Helvetica, Arial, sans-serif, "Apple Color Emoji",
               "Segoe UI Emoji", "Segoe UI Symbol";
--font-mono:   "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
```

**Use the system stack everywhere except:**
- `.ipynb` filenames (in trigger and dropdown rows)
- Keyboard-shortcut hints (`⌘ K`, `⌘ E`)
- Code blocks in the notebook canvas

These three contexts use JetBrains Mono. Do not use it for UI labels.

**Sizes used:**
- Button labels: 12.5px / weight 500 (active: 600)
- Dropdown row title: 13px / 500
- Dropdown row sub-line: 11.5px / 400
- Group headers in dropdown: 10px / 600 / uppercase / 0.6px tracking
- Filenames: 12px monospace
- Kbd hints: 10–10.5px monospace
- Last-edited meta (Document mode): 12px

---

## 11. Interaction patterns

### Mode switching
- Click an item in the centered switcher → mode changes.
- The right cluster animates content swap (no recommended motion at v1; instant swap is fine).
- The center cluster does **not** move horizontally.
- Mode is **per-tab** — switching active notebook restores that notebook's last mode.

### Tab dropdown
- ⌘K from anywhere in the workspace opens the dropdown (focus moves to search).
- Click trigger toggles.
- Click outside / Esc closes.
- Click row activates that notebook (and triggers a switch to its remembered mode).
- Click × on a clean row closes that notebook (with confirm only if dirty).
- The amber dot on a dirty row is **not clickable to dismiss** — it disappears when the file is saved.

### Run Active Cell
- Click left zone (label) → run the active cell.
- Click right zone (caret) → open menu.
- Keyboard: `Shift+Enter` runs the cell (existing JupyterLab shortcut). The toolbar primary mirrors that affordance visually.

### Edit App menu
- Click trigger → menu opens, focus moves to first item.
- Arrow up/down navigates. `Enter` activates. `Esc` closes.
- `⌘ E` is a global shortcut: when in App mode, it activates "Edit with AI" directly without opening the menu.

### Deploy
- Click → kicks off deploy flow (existing surface).
- The button does **not** change appearance based on deploy state; deploy progress lives in the status bar (per PM direction).

---

## 12. What lives elsewhere (out of scope for this spec)

- **Save** — accessible via `File > Save` and `⌘ S`. No toolbar button.
- **Kernel status** — lives in the JupyterLab status bar at the bottom, not in the toolbar.
- **The JupyterLab menu bar** — preserved as-is above this toolbar. Do not modify.
- **Left rail** (file tree, etc.) — unchanged.
- **Right rail** (Manage apps) — unchanged.
- **Run / kernel error states** — handled by the cell-output area, not the toolbar.

---

## 13. Open items (engineer-owned)

These were intentionally left out of design and delegated to engineering:

1. **Hover / pressed / focus / disabled** state polish for every interactive element. Defaults proposed in §8.5; tighten as needed against your platform conventions, but please do add visible focus rings (2px `#a78bfa`, 2px offset) — this is non-negotiable for accessibility.
2. **Screen-reader labels.** Every icon-only button (`+`, the trigger's caret, etc.) needs an `aria-label`. The mode switcher should be a `role="tablist"` with `role="tab"` items and `aria-selected`.
3. **Keyboard nav order.** Suggested: tab dropdown trigger → mode switcher → right cluster (left to right) → primary action → caret if separate. Tab order should never enter the canvas via toolbar tabbing.
4. **Long filename truncation** — implement 24-char middle truncation per §4 with full-name tooltip.
5. **Empty state** when zero notebooks are open — implement per §4.
6. **Dark theme variant** — not designed yet. If you ship dark before design provides tokens, use Lab's existing dark-theme grays and keep brand purple at the same hue with +10% lightness.
7. **Windows / Linux variant** — substitute `Ctrl` for `⌘` in all kbd hints. Same layout, same tokens.
8. **Usability test** (Q6 from review): we are deferring the dropdown-vs-strip BA test. Ship the dropdown; instrument open-rate and time-to-first-tab-switch so we can revisit if numbers look off.

---

## 14. Definition of done

- All five hi-fi artboards render at parity in the implementation: Notebook, Document, App+Deploy, App−Deploy, Tab dropdown open, Edit App menu open.
- ⌘K opens the tab dropdown from anywhere in the workspace.
- ⌘E activates "Edit with AI" when in App mode.
- Mode is persisted per-tab and restored on tab switch.
- Center mode switcher does not shift horizontally between modes.
- Visible focus rings on every interactive element when navigated by keyboard.
- All icon-only controls have screen-reader labels.

---

*Questions on any of this → ping design. Visual reference is `Mito Toolbar Hi-Fi.html`; treat the artboards as authoritative when this doc is ambiguous.*
