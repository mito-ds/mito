# Toolbar Redux — Phase 0 Research

**Goal:** Build a 52px-tall horizontal toolbar that sits below JupyterLab's menu bar, ideally spans the full width of the window (across left sidebar / main / right sidebar), and contains a left "tab dropdown" pill, an absolutely-positioned center mode switcher, and a right cluster of mode-specific buttons that — in Notebook mode — must include any toolbar items that third-party JupyterLab extensions inject into the notebook toolbar via the standard extension mechanism.

This doc evaluates two implementation paths against the JupyterLab source:

- **Option A** — reskin/inject into the per-`NotebookPanel` toolbar (`panel.toolbar`). Constrained to main-widget width.
- **Option E** — build a custom Lab-shell-level widget mounted in the JupyterLab shell, consuming `IToolbarWidgetRegistry` ourselves to mirror items meant for `Notebook`.

---

## 1. JupyterLab shell areas and widget mounting

### 1.1 The eight valid areas

From `@jupyterlab/application/src/shell.ts` (LabShell), areas are typed as a literal union (`shell.ts:85-93`):

```ts
export type Area =
  | 'main'
  | 'header'
  | 'top'
  | 'menu'
  | 'left'
  | 'right'
  | 'bottom'
  | 'down';
```

`app.shell.add(widget, area, options)` is the public entry point (`shell.ts:943-996`):

```ts
add(
  widget: Widget,
  area: ILabShell.Area = 'main',
  options?: DocumentRegistry.IOpenOptions
): void { ... }
```

`options.rank` (number, default 900 in Notebook 7, no global default in Lab) controls ordering inside a stacked area; `widget.id` is required.

### 1.2 The root layout — what spans full width vs. main-area width

This is the core architectural fact for our decision. From `LabShell` constructor (`shell.ts:436-440`):

```ts
rootLayout.direction = 'top-to-bottom';
rootLayout.addWidget(skipLinkWrapper);
rootLayout.addWidget(headerPanel);          // 'header'
rootLayout.addWidget(topHandler.panel);     // 'top' (contains the menu bar in multi-doc mode)
rootLayout.addWidget(hboxPanel);            // ['left' sidebar | main+down | 'right' sidebar]
rootLayout.addWidget(bottomPanel);          // 'bottom'
```

`hboxPanel` is the only thing that contains the sidebars (`shell.ts:418-420`):

```ts
hboxPanel.addWidget(leftHandler.sideBar);
hboxPanel.addWidget(vsplitPanel);
hboxPanel.addWidget(rightHandler.sideBar);
```

**Therefore:**

| Area      | Spans full window width? | Stacks vertically with siblings? | Notes |
|-----------|--------------------------|----------------------------------|-------|
| `header`  | **Yes**                  | Yes (above `top`)                | Above the menu bar. Hidden by default; JupyterLab issue #7279 — must give it `min-height` to be visible. |
| `top`     | **Yes**                  | Yes (between `header` and main)  | Hosts the menu bar (`menuHandler.panel`) at rank 100 in multi-doc mode. Other widgets stack with it. |
| `menu`    | **Yes** (in single-doc mode it is its own sibling; in multi-doc mode the menu lives inside `top`) | n/a | Reserved for the menu bar. |
| `left`    | side column only         | n/a                              | Sidebar. |
| `main`    | center column only       | n/a                              | Main dock panel. |
| `right`   | side column only         | n/a                              | Sidebar. |
| `bottom`  | full width               | Yes                              | Status bar lives here. |
| `down`    | center column only       | inside vsplit under main         | Console drawer area. |

So **the only full-width regions above the main content are `header` and `top`** — and `top` is the same area the menu bar uses, so adding our 52px toolbar there will simply stack it underneath the menu bar (since menu is at rank 100 by default).

### 1.3 `_addToTopArea` rank semantics

`shell.ts:1544-1565` (and the Private `PanelHandler` it delegates to) inserts widgets into a sorted list by `rank`. Lower rank = higher in the stack. The menu bar registers at rank 100 (`shell.ts:701: this.add(this._menuHandler.panel, 'top', { rank: 100 });` — this is the single-document mode path; in multi-doc the menu is added directly via `_topHandler.addWidget(this._menuHandler.panel, 100)` at line 479).

A custom widget added to `top` with `rank > 100` (e.g. 200) will appear **below** the menu bar and **above** the main content, full window width.

Constraint: the area only enforces that widgets have unique `id` and a `rank`. There is no cap on widget count.

### 1.4 Notebook 7's shell — different topology, important contrast

From `jupyter/notebook` `packages/application/src/shell.ts` (fetched live):

```ts
// areas: 'main' | 'top' | 'menu' | 'left' | 'right' | 'down'
// no 'header', no 'bottom'

const middleLayout = new BoxLayout({ spacing: 0, direction: 'top-to-bottom' });
const middlePanel = new Panel({ layout: middleLayout });
middlePanel.addWidget(this._topWrapper);   // 'top' lives HERE
middlePanel.addWidget(this._menuWrapper);  // 'menu' lives HERE
middlePanel.addWidget(this._spacer_top);
middlePanel.addWidget(this._main);
middlePanel.addWidget(this._spacer_bottom);

hsplitPanel.addWidget(leftHandler.panel);
hsplitPanel.addWidget(middlePanel);  // middlePanel sits BETWEEN sidebars
hsplitPanel.addWidget(rightHandler.panel);
```

**In Notebook 7, `top` and `menu` are NOT full-width** — they sit inside `middlePanel` between the sidebars. JupyterLab (Lab proper) is the opposite: `top` is full-width.

Implications: if mito-ai is ever expected to run inside Notebook 7 (it advertises a `@jupyter-notebook/application` plugin pattern in its plugin descriptors), Option E's full-width assumption breaks there. Lab-only deployments are fine.

Source: [jupyter/notebook shell.ts](https://github.com/jupyter/notebook/blob/main/packages/application/src/shell.ts)

---

## 2. `IToolbarWidgetRegistry`

### 2.1 Where it lives

- Token: `@jupyterlab/apputils/src/tokens.ts:417-421`
  ```ts
  export const IToolbarWidgetRegistry = new Token<IToolbarWidgetRegistry>(
    '@jupyterlab/apputils:IToolbarWidgetRegistry',
    `A registry for toolbar widgets. ...`
  );
  ```
- Interface: `@jupyterlab/apputils/src/tokens.ts:354-412`
- Implementation: `@jupyterlab/apputils/src/toolbar/registry.ts:19-120` (class `ToolbarWidgetRegistry`)
- `createToolbarFactory` helper: `@jupyterlab/apputils/src/toolbar/factory.ts:248-346`

### 2.2 Public API (verbatim signatures from `tokens.ts:354-412`)

```ts
addFactory<T extends Widget = Widget>(
  widgetFactory: string,
  toolbarItemName: string,
  factory: (main: T) => Widget
): ((main: T) => Widget) | undefined;

createWidget(
  widgetFactory: string,
  widget: Widget,
  toolbarItem: ToolbarRegistry.IWidget
): Widget;

registerFactory<...>(...): ...;   // deprecated since v4 — use addFactory

readonly factoryAdded: ISignal<this, string>;
defaultFactory: (widgetFactory, widget, toolbarItem) => Widget;
```

`addFactory` is **only** how a custom widget overrides the default rendering of a named toolbar item. It does NOT itself enumerate items — it stores per-item factories keyed by `(widgetFactory, toolbarItemName)`.

### 2.3 The settings-driven toolbar (the actual mechanism third-party extensions use)

The schema key — defined in `@jupyterlab/settingregistry/src/plugin-schema.json`:

```json
"jupyter.lab.toolbars": {
  "properties": {
    "^\\w[\\w-\\.]*$": {
      "items": { "$ref": "#/definitions/toolbarItem" },
      "type": "array",
      "default": []
    }
  }
}
```

Each `toolbarItem` shape:

```json
{
  "name":    "string (unique within toolbar)",
  "command": "string (command id)",
  "args":    "object (passed to command)",
  "icon":    "string (overrides command icon)",
  "label":   "string (overrides command label)",
  "caption": "string",
  "type":    "'command' | 'spacer'",
  "rank":    "number (default 50)",
  "disabled":"boolean"
}
```

`createToolbarFactory(toolbarRegistry, settingsRegistry, factoryName, pluginId, translator, propertyId='toolbar')` (`factory.ts:248-346`) does the heavy lifting: it walks **every loaded plugin's** `schema['jupyter.lab.toolbars'][factoryName]`, reconciles them by `rank`, listens for plugin changes, and returns a function `(widget: Widget) => IObservableList<ToolbarRegistry.IToolbarItem>`. That observable list updates as plugins come/go and as user settings change (`factory.ts:182-196`).

The reconciliation step (`factory.ts:97-101`):

```ts
.concat([(schema[TOOLBAR_KEY] ?? {})[factoryName] ?? []])
.reduceRight(
  (acc, val) => SettingRegistry.reconcileToolbarItems(acc, val, true),
  []
)!;
```

Then `setToolbar(widget, factory)` (`factory.ts:355-450`) wires the observable list into a target `Toolbar` widget, with full add/remove/move/set propagation.

### 2.4 Can a custom widget consume the registry to mirror "Notebook" items? — Yes.

Two paths:

**Path 1 (preferred, full machinery):** call `createToolbarFactory(reg, settings, 'Notebook', myPluginId, translator)` and then `setToolbar(myWidget, factory)`. This gives our custom widget the same observable item list the real notebook toolbar receives, including dynamic add/remove/reorder.

Caveat: `createToolbarFactory` calls `registry.transform(pluginId, ...)` (`factory.ts:119-167`). Per `factory.ts:168-176`, if the same pluginId is already transformed elsewhere it bails out (`listenPlugin = false`). The real notebook toolbar already runs this transform on `@jupyterlab/notebook-extension:tracker`. So if we re-use that same `pluginId` we will hit `TransformError` and silently lose live updates from plugin reloads — but the initial item list is still populated from `settings.composite[propertyId]`. We must use **our own** `pluginId` (e.g., `mito-ai:toolbar`) and ensure our schema declares `"jupyter.lab.transform": true` and `"toolbar": []`.

**Path 2 (manual):** subscribe to `settingsRegistry.load('@jupyterlab/notebook-extension:tracker')`, read `composite['toolbar']`, and call `toolbarRegistry.createWidget('Notebook', activePanel, item)` for each item. Less code, but we re-implement reconciliation and miss the cross-plugin merging that `setToolbarItems` does.

### 2.5 Lifecycle when active notebook changes

`createToolbarFactory` returns a function bound to a *single* widget. The observable list is shared across calls (it's the same `items` ObservableList for all consumers of the same `factoryName`/`pluginId` pair). Per-widget toolbar widgets are created on demand inside the returned closure (`factory.ts:325-332`):

```ts
const toolbar = new ObservableList<ToolbarRegistry.IToolbarItem>({
  values: Array.from(items).map(item => ({
    name: item.name,
    widget: toolbarRegistry.createWidget(factoryName, widget, item)
  }))
});
```

Most third-party items wrap commands (`type: 'command'`), so `defaultFactory` produces a `CommandToolbarButton` (`registry.ts:158-166`). These are stateless w.r.t. which notebook is active — clicking dispatches the command, which uses `notebookTracker.currentWidget`. **So we can render a single bar's worth of items and not re-render on tab change for command-typed items.** For factory-typed items (e.g., `kernelName`, `cellType` selectors that bind to a specific panel), we must rebuild on `notebookTracker.currentChanged`.

---

## 3. How real third-party extensions inject Notebook toolbar buttons

Surveyed:

| Extension | Mechanism | Reference |
|-----------|-----------|-----------|
| `jupyterlab/extension-examples` toolbar-button (canonical 4.x example) | **Pure schema.** Empty `activate()`. `schema/plugin.json` has `"jupyter.lab.toolbars": { "Notebook": [{ "name": "clear-all-outputs", "command": "notebook:clear-all-cell-outputs" }]}`. | [extension-examples/toolbar-button](https://github.com/jupyterlab/extension-examples/tree/main/toolbar-button) |
| `jupyterlab/jupyterlab-git` | Schema-based, but **only for FileBrowser** (`"jupyter.lab.toolbars": { "FileBrowser": [{ "name": "gitClone", "rank": 31 }]}`). Notebook integration is via diff providers + dialogs, not Notebook toolbar buttons. | [jupyterlab-git/schema/plugin.json](https://github.com/jupyterlab/jupyterlab-git/blob/main/schema/plugin.json) |
| `jupyterlab/jupyter-ai` | Schema-based. Defines `"jupyter.lab.toolbars": { "Cell": [...] }` but per [issue #871](https://github.com/jupyterlab/jupyter-ai/issues/871) the schema isn't loaded in current builds — illustrates that schema-based registration has a real-world failure mode (unloaded schemas). | issue #871 |
| `deshaw/jupyterlab-execute-time` | **Does not** add Notebook toolbar buttons; uses `DocumentRegistry.WidgetExtension.createNew(panel, ...)` to attach per-cell DOM. | [src/index.ts](https://github.com/deshaw/jupyterlab-execute-time/blob/master/src/index.ts) |
| Older / pre-3.2 extensions | Imperative: `panel.toolbar.insertItem(rank, name, button)` from inside a `DocumentRegistry.IWidgetExtension.createNew`. This bypasses the registry entirely and writes DOM directly into `panel.toolbar`. Documented in [JupyterLab discourse #24140](https://discourse.jupyter.org/t/custom-toolbar-button/24140). |

**Take-away:** the dominant modern pattern (JupyterLab 3.2+) is schema-based registration that funnels through `IToolbarWidgetRegistry` + `createToolbarFactory`. A non-trivial minority of older extensions still use `panel.toolbar.insertItem(...)` directly. **Both paths land items in `panel.toolbar`** — Option A naturally captures both; Option E captures the schema-based ones cleanly and can capture the imperative ones only by also observing the real `panel.toolbar` and mirroring its children.

---

## 4. Prior art — full-width custom shell toolbars

| Project | What they do | Relevance |
|---------|-------------|-----------|
| **Jupyter Notebook 7** | Custom `NotebookShell` (`@jupyter-notebook/application`) where the top/menu/main column sits between sidebars (NOT full width). Single shared toolbar above main content. Wires the same `IToolbarWidgetRegistry` + `createToolbarFactory('Notebook', ...)` as Lab. | Validates the "one toolbar, registry-driven" pattern works at scale. Source: [jupyter/notebook shell.ts](https://github.com/jupyter/notebook/blob/main/packages/application/src/shell.ts). |
| **JupyterLite** | Inherits Notebook 7's shell for its notebook UI; uses Lab's shell for its lab UI. No bespoke toolbar widget. | No new prior art beyond Notebook 7. |
| **Elyra** | Adds widgets to `left`/`right`/`main` (pipeline editor, metadata browser). Does not introduce a custom top-bar widget. | Confirms `app.shell.add(widget, area)` is the standard add API but doesn't show a top-area precedent. |
| **JupyterLab `application-extension:top-bar`** | A first-party plugin that adds a small `Toolbar` widget to the `top` area, to the right of the menu bar. Uses `app.shell.add(topBar, 'top')`. Other plugins extend it via `IToolbarWidgetRegistry.addFactory('TopBar', ...)`. | **Direct precedent** for adding a toolbar widget to `top` and having it span full window width. |
| **Mito's current `NotebookViewModePlugin`** | Per-`NotebookPanel`. Inserts a `ModeSwitcherToolbarWidget` at index 0 of `panel.toolbar`, plus a spacer at index 1, so existing buttons get pushed to the right (`NotebookViewModePlugin.ts:441-461`). Adds a separate `ModeToolbarWidget` to `panel.contentHeader` that is shown only in Document/App modes. Mode toolbars are scoped to one notebook tab; switching tabs requires the full per-panel setup to have run on `notebookTracker.widgetAdded`. | This is essentially Option A today. The constraint to `panel.toolbar` width is real — see `NotebookToolbar.css`. |

---

## 5. Local-source pointer index for the implementer

| Need | File | Key exports / lines |
|------|------|---------------------|
| Shell areas + `add(widget, area, options)` | `node_modules/@jupyterlab/application/src/shell.ts` | `ILabShell.Area` (line 85), `LabShell.add` (line 943), `_addToTopArea` (line 1544), `rootLayout` build (lines 365-440) |
| `IToolbarWidgetRegistry` token + interface | `node_modules/@jupyterlab/apputils/src/tokens.ts` | `IToolbarWidgetRegistry` interface (line 354), `Token` (line 417), `ToolbarRegistry.IWidget` (line 328) |
| Registry implementation | `node_modules/@jupyterlab/apputils/src/toolbar/registry.ts` | `ToolbarWidgetRegistry` (line 19), `createDefaultFactory` (line 128) |
| Settings-driven toolbar wiring | `node_modules/@jupyterlab/apputils/src/toolbar/factory.ts` | `createToolbarFactory` (line 248), `setToolbar` (line 355), `setToolbarItems` (line 61) |
| Toolbar item JSON schema | `node_modules/@jupyterlab/settingregistry/src/plugin-schema.json` | `jupyter.lab.toolbars` block, `toolbarItem` definition |
| Mito's existing per-panel injection | `src/Extensions/NotebookViewMode/NotebookViewModePlugin.ts` | `_addModeSwitcherToToolbar` (line 441), `_addModeToolbarToContentHeader` (line 393) |
| Mito's existing schema-based items | `schema/toolbar-buttons.json` | currently registers `Cell` items only; `"Notebook": []` is empty |

`@jupyter-notebook/application` is **not** installed in this project's `node_modules`. If the team plans to support Notebook 7, they'll need to add it as an optional peer dep.

---

## 6. Recommendation

The team has decided full-width is the goal. The evidence supports **Option E is feasible in JupyterLab proper, with caveats**:

**In favor of Option E:**
- `top` area is full-width and explicitly designed to stack widgets via `rank`. There's first-party precedent (JupyterLab's own `application-extension:top-bar`).
- `IToolbarWidgetRegistry` + `createToolbarFactory('Notebook', ...)` exposes exactly the observable list of items third-party extensions register via the modern (3.2+) schema mechanism. Wiring it into our own widget is ~30 lines.
- For command-typed items (the vast majority), button widgets are notebook-agnostic — we don't need to re-render on tab change.
- We sidestep the layout fight against Lumino's `Toolbar` `ReactiveToolbar` resize/collapse behavior that already bites us (`NotebookViewModePlugin.ts:457-460` mentions an existing workaround).

**Risks specific to Option E:**

1. **Older / DOM-injecting extensions are invisible to us.** Extensions that do `panel.toolbar.insertItem(...)` from a `DocumentRegistry.WidgetExtension` skip the registry. To mirror them we'd need to observe `panel.toolbar.layout.widgets` and replicate. **Mitigation:** also keep `panel.toolbar` rendered (hidden), then in our top widget render a clone of its children for the active notebook on `notebookTracker.currentChanged`. Or simpler: accept that schema-registered items work; legacy items don't appear in our bar (they still work in their original location if we don't hide it).
2. **Notebook 7 incompatibility.** `top` is not full-width there. If we want one codebase to ship, branch on shell type at activation.
3. **Transform collision.** If two plugins call `createToolbarFactory` with the same `pluginId`, the second silently degrades (no live plugin reload). We must use our own `pluginId` and avoid passing `@jupyterlab/notebook-extension:tracker`.
4. **Single-document mode.** In single-doc mode the menu bar moves out of `top` (`shell.ts:482`). Our widget at rank 200 will still render but the visual relationship to the menu changes. Test.
5. **Tab-aware items.** A small set of registered items (`kernelName`, `cellType`, `kernelStatus`, `executionProgress`) bind to a specific `NotebookPanel` via factory functions. For these, items must be re-created on `currentChanged`. `createToolbarFactory` handles this if we re-call its returned function with the new active panel.
6. **Empty-state UX.** When no notebook is open, what does the right cluster show? Need a defined empty state — this is a Phase 1 design decision, not a feasibility blocker.
7. **Header area is not viable as an alternative.** Per [JupyterLab issue #7279](https://discourse.jupyter.org/t/.../3682), `header` is hidden until something gives it `min-height`. `top` is the right choice; flagging only because some docs steer people to `header`.

**Strategy within Option E:**

- Mount the new toolbar at `area: 'top'`, `rank: 150` (between menu at 100 and any future top-area additions; Lab itself doesn't use that band).
- Use `createToolbarFactory` with a `pluginId` of `mito-ai:toolbar` and `factoryName: 'Notebook'`. Add `"jupyter.lab.transform": true` and `"toolbar": []` to `schema/toolbar-buttons.json` (or a new schema).
- For the right cluster, render the observable list directly inside our React tree — don't use Lumino's `Toolbar` widget at all. We control the 52px box.
- Keep `panel.toolbar.hide()` (or set it to `display: none` via CSS). The mode switcher and tab dropdown live in our widget; cell-level controls (`Run`, cell type) need to migrate or be picked up via the same registry.
- For tab switches: subscribe to `notebookTracker.currentChanged` and re-invoke the factory closure. For command-typed items this is essentially a no-op visually.
- For the imperative-injection minority: document as a known limitation in v1; revisit if a target customer extension is affected.

---

## 7. Concrete implementation sketch (Option E)

```ts
// mito-ai/src/Extensions/Toolbar/MitoToolbarPlugin.ts

import { JupyterFrontEnd, JupyterFrontEndPlugin, ILabShell }
  from '@jupyterlab/application';
import { IToolbarWidgetRegistry, createToolbarFactory, setToolbar }
  from '@jupyterlab/apputils';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ITranslator, nullTranslator } from '@jupyterlab/translation';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { ReactWidget, Toolbar } from '@jupyterlab/ui-components';
import { Widget, BoxLayout, Panel } from '@lumino/widgets';

const MITO_TOOLBAR_PLUGIN_ID = 'mito-ai:toolbar';

class MitoTopToolbarWidget extends Widget {
  readonly leftCluster = new Panel();    // tab dropdown pill
  readonly centerCluster = new Panel();  // mode switcher (absolutely positioned)
  readonly rightCluster = new Toolbar(); // Lumino toolbar — receives mirrored items

  constructor() {
    super();
    this.id = 'mito-top-toolbar';
    this.addClass('mito-top-toolbar');
    this.node.style.height = '52px';
    const layout = new BoxLayout({ direction: 'left-to-right', spacing: 0 });
    layout.addWidget(this.leftCluster);
    BoxLayout.setStretch(this.leftCluster, 0);
    layout.addWidget(this.centerCluster); // CSS: position:absolute; left:50%
    BoxLayout.setStretch(this.centerCluster, 0);
    layout.addWidget(this.rightCluster);
    BoxLayout.setStretch(this.rightCluster, 1);
    this.layout = layout;
  }
}

const plugin: JupyterFrontEndPlugin<void> = {
  id: MITO_TOOLBAR_PLUGIN_ID,
  autoStart: true,
  requires: [
    ILabShell,
    IToolbarWidgetRegistry,
    ISettingRegistry,
    INotebookTracker,
    ITranslator
  ],
  activate: (
    app: JupyterFrontEnd,
    shell: ILabShell,
    toolbarRegistry: IToolbarWidgetRegistry,
    settingsRegistry: ISettingRegistry,
    notebookTracker: INotebookTracker,
    translator: ITranslator
  ) => {
    const widget = new MitoTopToolbarWidget();

    // 1. Mount in shell, full width, below the menu bar.
    shell.add(widget, 'top', { rank: 150 });

    // 2. Build the registry-backed item list for the 'Notebook' factory.
    //    NOTE: pluginId must be ours; otherwise transform() collides with
    //    @jupyterlab/notebook-extension:tracker (see factory.ts:119-176).
    const factory = createToolbarFactory(
      toolbarRegistry,
      settingsRegistry,
      'Notebook',
      MITO_TOOLBAR_PLUGIN_ID,
      translator ?? nullTranslator
    );

    // 3. Bind that list to our right-cluster Toolbar against the *active*
    //    notebook. Re-bind on tab change because some items (kernelName,
    //    cellType) are tied to a specific NotebookPanel.
    let currentBinding: { panel: NotebookPanel | null } = { panel: null };

    const rebindRightCluster = (panel: NotebookPanel | null) => {
      // Clear existing children
      Array.from(widget.rightCluster.layout!).forEach((c: any) => c.parent = null);
      if (!panel) return;
      // setToolbar wires the observable list -> our Toolbar.
      // Pass the active NotebookPanel as the "main widget" arg so
      // factory items that need the panel get the right one.
      setToolbar(panel as any, factory, widget.rightCluster);
      currentBinding.panel = panel;
    };

    notebookTracker.currentChanged.connect((_, panel) => {
      rebindRightCluster(panel);
    });
    rebindRightCluster(notebookTracker.currentWidget);

    // 4. Hide the per-panel native toolbar so items don't show twice.
    //    Do this on every panel; existing NotebookViewMode logic already
    //    toggles panel.toolbar visibility — extend that to always-hide
    //    in the new world.
    notebookTracker.widgetAdded.connect((_, panel) => {
      panel.toolbar.hide();
    });

    // 5. Render React for left + center clusters into their host nodes
    //    (use ReactWidget pattern as in ModeToolbarWidget).
  }
};
```

Schema sibling (`schema/toolbar-buttons.json` extension or new file):

```json
{
  "title": "mito-ai toolbar",
  "jupyter.lab.transform": true,
  "properties": { "toolbar": { "type": "array", "default": [] } },
  "jupyter.lab.toolbars": {
    "Notebook": [
      { "name": "mito-explain", "command": "mito-ai:explain", "rank": 10 }
    ]
  },
  "additionalProperties": false,
  "type": "object"
}
```

---

## 8. Open questions / things to validate in Phase 1

- **Verify** that `setToolbar(panel, factory, widget.rightCluster)` actually reuses the shared `items` ObservableList across our re-binds (factory closure recreates a per-call observable — read `factory.ts:325-345` carefully; we may want one persistent `Toolbar` and to drive item swap-in/out manually rather than re-call `setToolbar`).
- Confirm in a running Lab: after our plugin activates, do registered items (e.g. an installed `jupyter-ai`-style extension) actually appear in our right cluster, vs. only in the now-hidden `panel.toolbar`?
- Check whether hiding `panel.toolbar` breaks anything that listens to its DOM (e.g. `executionProgress`).
- Single-document mode visual regression test: does our 52px bar end up below the (relocated) menu bar in single-doc mode?
- Notebook 7: do we ship a separate plugin file with `INotebookShell` requirement, or just no-op there?
- Imperative-injection coverage: pick 3 popular extensions in our customer base and verify whether they use schema or `panel.toolbar.insertItem`.
- Accessibility: `top` panel has `role="banner"` (`shell.ts:347`); our toolbar should set its own appropriate ARIA role (e.g. `role="toolbar"`) on its node.

## Sources

- [JupyterLab packages/notebook-extension/src/index.ts (main)](https://github.com/jupyterlab/jupyterlab/blob/main/packages/notebook-extension/src/index.ts)
- [Jupyter Notebook 7 shell.ts](https://github.com/jupyter/notebook/blob/main/packages/application/src/shell.ts)
- [extension-examples toolbar-button](https://github.com/jupyterlab/extension-examples/tree/main/toolbar-button) — canonical schema-based registration example
- [jupyterlab-git plugin schema](https://github.com/jupyterlab/jupyterlab-git/blob/main/schema/plugin.json)
- [jupyterlab-execute-time src/index.ts](https://github.com/deshaw/jupyterlab-execute-time/blob/master/src/index.ts)
- [jupyter-ai issue #871: schema not loaded](https://github.com/jupyterlab/jupyter-ai/issues/871)
- [JupyterLab 4 IToolbarWidgetRegistry API docs](https://jupyterlab.readthedocs.io/en/4.2.x/api/interfaces/apputils.IToolbarWidgetRegistry.html)
- [JupyterLab 4.5 Common Extension Points — toolbar customization](https://jupyterlab.readthedocs.io/en/stable/extension/extension_points.html)
- [Discourse: header area not visible (issue #7279)](https://discourse.jupyter.org/t/plugin-extension-development-adding-a-widget-to-header-area-of-jupyterfrontend-ishell-does-not-make-the-area-visible/3682)
- [Discourse: Custom Toolbar Button (#24140)](https://discourse.jupyter.org/t/custom-toolbar-button/24140)
- [PR #10469 — original toolbar-customization machinery](https://github.com/jupyterlab/jupyterlab/pull/10469)
