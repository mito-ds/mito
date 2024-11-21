import { Facet, type Extension } from '@codemirror/state';
import {
  Decoration,
  EditorView,
  ViewPlugin,
  WidgetType,
  type DecorationSet,
  type ViewUpdate
} from '@codemirror/view';

/**
 * Theme for the advice widget.
 */
const adviceTheme = EditorView.baseTheme({
  '& .cm-mito-advice': {
    color: 'var(--jp-ui-font-color3)',
    fontStyle: 'italic'
  },
  '& .cm-mito-advice > kbd': {
    borderRadius: '3px',
    borderStyle: 'solid',
    borderWidth: '1px',
    fontSize: 'calc(var(--jp-code-font-size) - 2px)',
    padding: '3px 5px',
    verticalAlign: 'middle'
  }
});

/**
 * A facet that stores the chat shortcut.
 */
const chatShortcut = Facet.define<string[], string[]>({
  combine: values => (values.length ? values[values.length - 1] : [''])
});

class AdviceWidget extends WidgetType {
  constructor(readonly shortcut: string[]) {
    super();
  }

  eq(other: AdviceWidget) {
    return false;
  }

  toDOM() {
    const wrap = document.createElement('span');
    wrap.className = 'cm-mito-advice';
    // FIXME it should come from JupyterLab setting
    wrap.innerHTML = `Press ${this.shortcut.map(s => `<kbd>${s}</kbd>`).join(' + ')} to ask Mito AI to do something. Start typing to dismiss.`;
    return wrap;
  }
}

function shouldDisplayAdvice(view: EditorView): DecorationSet {
  const shortcut = view.state.facet(chatShortcut);
  const widgets = [];
  if (view.hasFocus && view.state.doc.length == 0) {
    const deco = Decoration.widget({
      widget: new AdviceWidget(shortcut),
      side: 1
    });
    widgets.push(deco.range(0));
  }
  return Decoration.set(widgets);
}

export const showAdvice = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = shouldDisplayAdvice(view);
    }

    update(update: ViewUpdate) {
      const shortcut = update.view.state.facet(chatShortcut);
      if (
        update.docChanged ||
        update.focusChanged ||
        shortcut.join('') !== update.startState.facet(chatShortcut).join('')
      ) {
        this.decorations = shouldDisplayAdvice(update.view);
      }
    }
  },
  {
    decorations: v => v.decorations,
    provide: () => [adviceTheme]
  }
);

export function advicePlugin(options: { shortcut?: string[] } = {}): Extension {
  return [chatShortcut.of(options.shortcut ?? ['Ctrl', 'E']), showAdvice];
}
