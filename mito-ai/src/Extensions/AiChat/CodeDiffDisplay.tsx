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
    // We need to set some transparency because the stripe are above
    // the selection layer
    '&light .cm-codeDiffRemovedStripe': { backgroundColor: '#fad4d4aa' },
    '&dark .cm-codeDiffRemovedStripe': { backgroundColor: '#3b0101aa' },

    '&light .cm-codeDiffInsertedStripe': { backgroundColor: '#009e08aa' },
    '&dark .cm-codeDiffInsertedStripe': { backgroundColor: '#013b12aa' }


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
  function stripeDeco(view: EditorView) {
    console.log(view.state.facet(unifiedDiffLines))
    console.log(view)
    const unifiedDiffLinesFacet = view.state.facet(unifiedDiffLines)[0];
    const builder = new RangeSetBuilder<Decoration>();
    for (const { from, to } of view.visibleRanges) {
      for (let pos = from; pos <= to; ) {
        const line = view.state.doc.lineAt(pos);
        console.log('LINE NUMBER', line.number, unifiedDiffLinesFacet[line.number])
        // The code mirror line numbers are 1-indexed, but our diff lines are 0-indexed
        if (unifiedDiffLinesFacet[line.number - 1].type === 'removed') {
          builder.add(line.from, line.from, removedStripe);
        }
        if (unifiedDiffLinesFacet[line.number - 1].type === 'added') {
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
        this.decorations = stripeDeco(view);
      }
  
      update(update: ViewUpdate) {
        // Update the stripes if the document changed,
        // the viewport changed or the stripes step changed.
        const oldUnifiedDiffLines = update.startState.facet(unifiedDiffLines);
        if (
          update.docChanged ||
          update.viewportChanged ||
          oldUnifiedDiffLines !== update.view.state.facet(unifiedDiffLines)
        ) {
          this.decorations = stripeDeco(update.view);
        }
      }
    },
    {
      decorations: v => v.decorations
    }
  );
  
  // Full extension composed of elemental extensions
  export function zebraStripes(options: { unifiedDiffLines?: UnifiedDiffLine[]} = {}): Extension {
    return [
        baseTheme,
        options.unifiedDiffLines ? unifiedDiffLines.of(options.unifiedDiffLines) : [],
        showStripes
    ];
  }
  