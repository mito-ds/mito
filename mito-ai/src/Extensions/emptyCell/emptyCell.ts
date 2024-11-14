import {
  Decoration,
  EditorView,
  ViewPlugin,
  WidgetType,
  type DecorationSet,
  type ViewUpdate
} from '@codemirror/view';

const adviceTheme = EditorView.baseTheme({
  '.cm-mito-advice': {
    color: 'var(--jp-ui-font-color3)',
    fontStyle: 'italic'
  }
});

class AdviceWidget extends WidgetType {
  eq(other: AdviceWidget) {
    return false;
  }

  toDOM() {
    const wrap = document.createElement('span');
    wrap.className = 'cm-mito-advice';
    // FIXME it should come from JupyterLab setting
    wrap.innerHTML = `Press <kdb>Ctrl</kdb> + <kdb>E</kdb> to ask Mito AI to do something. Start typing to dismiss.`;
    return wrap;
  }
}

function shouldDisplayAdvice(view: EditorView): DecorationSet {
  const widgets = [];
  if (view.hasFocus && view.state.doc.length == 0) {
    const deco = Decoration.widget({ widget: new AdviceWidget(), side: -1 });
    widgets.push(deco.range(0));
  }
  return Decoration.set(widgets);
}

export const advicePlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = shouldDisplayAdvice(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.focusChanged) {
        this.decorations = shouldDisplayAdvice(update.view);
      }
    }
  },
  {
    decorations: v => v.decorations,
    provide: () => [adviceTheme]
  }
);
