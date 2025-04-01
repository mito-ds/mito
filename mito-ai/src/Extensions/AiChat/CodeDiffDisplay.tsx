/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { Extension, Facet, RangeSetBuilder } from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate
} from '@codemirror/view';
import { UnifiedDiffLine } from '../../utils/codeDiff';
import { deepEqualArrays } from '../../utils/arrays';


// Defines new styles for this extension
const baseTheme = EditorView.baseTheme({
  // We need to set some transparency because the stripes are above the selection layer
  '.cm-codeDiffRemovedStripe': { backgroundColor: 'color-mix(in srgb, var(--error-color) 30%, transparent)' },
  '.cm-codeDiffInsertedStripe': { backgroundColor: 'color-mix(in srgb, var(--jp-accent-color2) 35%, transparent)' },
});

// Resolve step to use in the editor
const unifiedDiffLines = Facet.define<UnifiedDiffLine[]>({
  combine: (unifiedDiffLines) => {
    return unifiedDiffLines
  }
});

// Add decoration to editor lines
const removedStripe = Decoration.line({
  attributes: { class: 'cm-codeDiffRemovedStripe' }
});

const insertedStripe = Decoration.line({
  attributes: { class: 'cm-codeDiffInsertedStripe' }
});

// Create the range of lines requiring decorations
const getCodeDiffStripesDecoration = (view: EditorView): DecorationSet => {
  const unifiedDiffLinesFacet = view.state.facet(unifiedDiffLines)[0];
  const builder = new RangeSetBuilder<Decoration>();
  for (const { from, to } of view.visibleRanges) {
    for (let pos = from; pos <= to;) {
      const line = view.state.doc.lineAt(pos);

      // The code mirror line numbers are 1-indexed, but our diff lines are 0-indexed
      if (line.number - 1 >= (unifiedDiffLinesFacet?.length ?? 0)) {
        /* 
          Because we need to rerender the decorations each time the doc changes or viewport updates
          (maybe we don't need to, but the code mirror examples does this so we will to for now) there
          is a race condition where sometimes the content of the code cell updates before the unified diff lines
          are updated. As a result, we need to break out of the loop before we get a null pointer error.

          This isn't a problem because right afterwards, the code mirror updates again due to the unified diff lines
          being updated. In that render, we get the correct results. 
        */ 
        break
      }
      if (unifiedDiffLinesFacet?.[line.number - 1]?.type === 'removed') {
        builder.add(line.from, line.from, removedStripe);
      }
      if (unifiedDiffLinesFacet?.[line.number - 1]?.type === 'inserted') {
        builder.add(line.from, line.from, insertedStripe);
      }
      pos = line.to + 1;
    }
  }
  return builder.finish();
}

// Update the decoration status of the editor view
const showStripes = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = getCodeDiffStripesDecoration(view);
    }

    update(update: ViewUpdate): void {
      const oldUnifiedDiffLines = update.startState.facet(unifiedDiffLines);
      const newUnifiedDiffLines = update.view.state.facet(unifiedDiffLines);

      if (
        update.docChanged ||
        update.viewportChanged ||
        !deepEqualArrays(oldUnifiedDiffLines[0] ?? [], newUnifiedDiffLines[0] ?? [])
      ) {
        this.decorations = getCodeDiffStripesDecoration(update.view);
      }
    }
  },
  {
    decorations: v => v.decorations
  }
);

// Create the Code Mirror Extension to apply the code diff stripes to the code mirror editor
export function codeDiffStripesExtension(options: { unifiedDiffLines?: UnifiedDiffLine[] } = {}): Extension {
  return [
    baseTheme,
    options.unifiedDiffLines ? unifiedDiffLines.of(options.unifiedDiffLines) : [],
    showStripes
  ];
}

