/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

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
const adviceText = Facet.define<string, string>({
  // @ts-expect-error - Ignoring this error because I don't want to mess with codemirror for now
  combine: values => (values.length ? values[values.length - 1] : '')
});

class AdviceWidget extends WidgetType {
  constructor(readonly advice: string) {
    super();
  }

  eq(_: AdviceWidget): boolean {
    return false;
  }

  toDOM(): HTMLElement {
    const wrap = document.createElement('span');
    wrap.className = 'cm-mito-advice';
    wrap.innerHTML = this.advice;
    return wrap;
  }
}

function shouldDisplayAdvice(view: EditorView): DecorationSet {
  const shortcut = view.state.facet(adviceText);
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

    update(update: ViewUpdate): void {
      const advice = update.view.state.facet(adviceText);
      if (
        update.docChanged ||
        update.focusChanged ||
        advice !== update.startState.facet(adviceText)
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

export function advicePlugin(options: { advice?: string } = {}): Extension {
  return [adviceText.of(options.advice ?? ''), showAdvice];
}
