import {
  Decoration,
  DecorationSet,
  EditorView,
  MatchDecorator,
  ViewPlugin,
  ViewUpdate,
  WidgetType
} from '@codemirror/view';

class PlaceholderWidget extends WidgetType {
  constructor(public name: string) {
    super();
    this.name = name;
  }
  eq(other: PlaceholderWidget) {
    return this.name == other.name;
  }
  toDOM() {
    let elt = document.createElement('span');
    elt.style.cssText = `
    border: 1px solid blue;
    border-radius: 4px;
    padding: 0 3px;
    background: lightblue;`;
    elt.textContent = this.name;
    return elt;
  }
  ignoreEvent() {
    return false;
  }
}

const magicMatcher = new MatchDecorator({
  regexp: /^(%%sql|%%sql\s.*)$/g,
  decoration: match =>
    Decoration.replace({
      widget: new PlaceholderWidget('SQL')
    })
});

export const hideSqlMagic = ViewPlugin.fromClass(
  class {
    hideSqlMagic: DecorationSet;
    constructor(view: EditorView) {
      this.hideSqlMagic = magicMatcher.createDeco(view);
    }
    update(update: ViewUpdate) {
      this.hideSqlMagic = magicMatcher.updateDeco(update, this.hideSqlMagic);
    }
  },
  {
    decorations: instance => instance.hideSqlMagic,
    provide: plugin =>
      EditorView.atomicRanges.of(view => {
        return view.plugin(plugin)?.hideSqlMagic || Decoration.none;
      })
  }
);
