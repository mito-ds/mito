# Phase 0 Verification Learnings

This note captures what we learned while verifying the Phase 0 Toolbar Redux work in JupyterLab.

## Context

Phase 0 adds a new Mito toolbar as a JupyterLab shell-level widget mounted in the `top` area at `rank: 150`.

The toolbar should:

- Sit directly below JupyterLab's menu/top row.
- Span the full window width.
- Be 52px tall.
- Replace the old per-notebook mode toolbar UI.
- Keep the mode switcher centered.

During verification, the toolbar components were rendering, but the toolbar overlapped JupyterLab's existing top UI and notebook content.

## What Was Working

The core Mito toolbar implementation was mostly healthy:

- `MitoToolbarWidget` mounted successfully.
- The mode switcher rendered.
- `Notebook | Document | App` appeared in the accessibility tree.
- `Run Active Cell` and the right-cluster controls rendered.
- The watcher/build was clean.
- Switching the toolbar root from Lumino `BoxLayout` to `PanelLayout` fixed the toolbar's internal layout enough for CSS positioning to work.

So the issue was not primarily React rendering, the mode switcher component, or the toolbar widget itself.

## Initial Symptom

The toolbar first appeared in the same horizontal band as the menu bar. The mode switcher and run button visually overlapped `File Edit View Run ...`.

Browser measurements confirmed that the file menu and mode switcher were both near the top of the page. The toolbar was visible, but it was not occupying its own reserved vertical row.

## First Discovery: Top Panel Flex Direction

JupyterLab's `#jp-top-panel` defaults to a horizontal flex layout:

```css
#jp-top-panel {
  display: flex;
}
```

Because the Mito toolbar was added to the same `top` area as the menu, it became another flex child in the same row.

Changing the top panel to a column helped:

```css
#jp-top-panel {
  flex-direction: column;
}
```

That made the menu/top row and Mito toolbar stack vertically.

## Why That Was Not Enough

After stacking the rows, the toolbar still overlapped the notebook tabs/content. The mode switcher was visually below the menu, but the main shell content started too high.

The important measured state was:

- Mode switcher: approximately `y=59-95`.
- Main shell/sidebar: approximately `y=80`.

That meant the main app content still began inside the toolbar row.

So the problem became: the toolbar was visible, but JupyterLab was not reserving enough vertical layout space for it.

## What Did Not Solve It

Several Lumino/layout nudges did not fix the overlap:

- Setting `#jp-top-panel` `min-height` via CSS using the menu height variable.
- Setting inline `topPanelNode.style.minHeight`.
- Trying `requestAnimationFrame`.
- Waiting for `app.restored`.
- Dispatching `window.resize`.
- Walking up the Lumino parent widget chain and sending `Widget.Msg.FitRequest`.
- Temporarily logging actual/computed dimensions.

The takeaway: these approaches mostly tried to force Lumino to recompute layout, but the deeper issue was CSS/layout behavior on the top panel itself.

## Second Discovery: Size Containment

JupyterLab's default CSS for `#jp-top-panel` includes:

```css
#jp-top-panel {
  contain: style size !important;
}
```

The `size` containment is important. It means descendants do not naturally affect the container's size in the way a normal flex container would.

That explained why the toolbar could visually paint into the page while the surrounding shell layout did not reserve clean space for it.

## What We Tried Based On That

We tested removing only size containment:

```css
#jp-top-panel {
  contain: style !important;
}
```

Then we tested disabling containment:

```css
#jp-top-panel {
  contain: none !important;
}
```

Those changes alone were directionally right, but they did not fully solve the overlap.

## Final Working Insight

The geometry showed that the existing JupyterLab top/menu row in this environment behaves like a 52px row, not like the `27px` menu height variable we originally assumed.

So the correct reserved height was not:

```text
27px + 52px = 79px
```

It was effectively:

```text
52px + 52px = 104px
```

Once the top panel reserved 104px, the shell layout behaved correctly.

The working CSS direction:

```css
#jp-top-panel {
  align-items: stretch;
  contain: none !important;
  flex-direction: column;
  min-height: 104px !important;
}
```

After this change:

- Mode switcher remained at approximately `y=59-95`.
- Main shell/sidebar started at `y=104`.
- The toolbar no longer overlapped notebook tabs/content.
- The File menu still opened.
- Lints passed.
- The temporary JS layout/debug workaround was removed.

## Current Diagnosis

The root issue was a combination of three JupyterLab top-panel behaviors:

1. `#jp-top-panel` is `display: flex` in row mode by default, so new top-area widgets share a row unless overridden.
2. `contain: style size !important` prevents child-driven sizing from behaving naturally.
3. The top shell area needs to reserve 104px in this environment: one 52px existing top row plus one 52px Mito toolbar row.

## Engineering Takeaway

The solution should stay CSS-driven. Avoid JS layout hacks like inline min-height updates, resize events, manual Lumino fit requests, or debug logging.

Those hacks made the system harder to reason about and did not fix the actual problem. The browser layout contract was wrong; once the top panel's CSS and reserved height matched the intended two-row layout, the shell behaved.

## Remaining Caveats

This fix overrides JupyterLab core top-panel CSS, so it should be verified carefully:

- File/Edit/View menu behavior.
- Left and right sidebar behavior.
- Notebook tab switching.
- Opening and closing notebooks.
- No active notebook and non-notebook active widget states.
- Mode switching between Notebook, Document, and App.
- Different viewport widths.
- Menu z-index or overflow regressions caused by `contain: none`.

## Current Recommendation

Keep the CSS-only approach:

- Stack `#jp-top-panel` vertically.
- Use `contain: none !important`.
- Reserve `104px` on the top panel.
- Keep `.mito-top-toolbar` fixed at 52px.
- Do not add JS layout hacks.

Then continue Phase 0 verification against the functional requirements now that the top-level geometry is sane.
