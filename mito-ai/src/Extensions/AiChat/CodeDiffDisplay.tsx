import { Extension, Facet, RangeSetBuilder } from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate
} from '@codemirror/view';
import { UnifiedDiffLine } from '../../utils/codeDiff';


// Defines new styles for this extension
const baseTheme = EditorView.baseTheme({
  // We need to set some transparency because the stripes are above the selection layer
  '.cm-codeDiffRemovedStripe': { backgroundColor: 'rgba(250, 212, 212, 0.62)' },
  '.cm-codeDiffInsertedStripe': { backgroundColor: 'rgba(79, 255, 105, 0.38)' },
});

// Resolve step to use in the editor
const unifiedDiffLines = Facet.define<UnifiedDiffLine[]>({
  // TODO: Do I need to provide a combine step?
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
      if (unifiedDiffLinesFacet[line.number - 1].type === 'removed') {
        builder.add(line.from, line.from, removedStripe);
      }
      if (unifiedDiffLinesFacet[line.number - 1].type === 'inserted') {
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

    update(update: ViewUpdate) {
      const oldUnifiedDiffLines = update.startState.facet(unifiedDiffLines);
      if (
        update.docChanged ||
        update.viewportChanged ||
        oldUnifiedDiffLines !== update.view.state.facet(unifiedDiffLines)
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
