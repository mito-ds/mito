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

## Updated Working Insight

The first pass reserved `104px` because the existing JupyterLab top area appeared to behave like one `52px` row plus the `52px` Mito toolbar row.

That turned out to be too broad. After forcing `#jp-top-panel` into a column layout, JupyterLab's first-party `#jp-MainLogo` and `#jp-top-bar` widgets each became their own vertical rows. The logo consumed an extra row at the top-left and the top bar produced a blank white row where the old top toolbar used to be.

The current fix is to hide those two first-party top-area widgets and reserve only the normal menu row plus the Mito toolbar row:

The working CSS direction:

```css
#jp-top-panel {
  align-items: stretch;
  contain: none !important;
  flex-direction: column;
  min-height: calc(var(--jp-private-menubar-height, 28px) + 52px) !important;
}

[id='jp-MainLogo'],
#jp-top-bar {
  display: none !important;
}
```

After this change:

- The Jupyter logo no longer gets its own row.
- The empty first-party top bar row is gone.
- The Mito toolbar sits directly under the File/Edit/View menu.
- The notebook tabs/content start immediately below the Mito toolbar.
- The File menu still opened.
- Lints passed.
- The temporary JS layout/debug workaround was removed.

## Current Diagnosis

The root issue was a combination of four JupyterLab top-panel behaviors:

1. `#jp-top-panel` is `display: flex` in row mode by default, so new top-area widgets share a row unless overridden.
2. `contain: style size !important` prevents child-driven sizing from behaving naturally.
3. `#jp-MainLogo` and `#jp-top-bar` are first-party top-area widgets that become visible rows once the top panel is stacked vertically.
4. The top shell area should reserve only the menu row plus the 52px Mito toolbar row after those extra first-party widgets are hidden.

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
- Hide `#jp-MainLogo` and `#jp-top-bar`.
- Reserve `calc(var(--jp-private-menubar-height, 28px) + 52px)` on the top panel.
- Keep `.mito-top-toolbar` fixed at 52px.
- Do not add JS layout hacks.

Then continue Phase 0 verification against the functional requirements now that the top-level geometry is sane.
