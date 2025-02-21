import {
  Decoration,
  DecorationSet,
  EditorView,
  MatchDecorator,
  ViewPlugin,
  ViewUpdate,
  WidgetType
} from '@codemirror/view';

/**
 * Class name for the SQL magic placeholder
 */
const SQL_MAGIC_PLACEHOLDER_CLASS = 'cm-mito-sql-magic';

/**
 * Theme for the SQL magic placeholder
 */
const sqlMagicTheme = EditorView.baseTheme({
  [`& .${SQL_MAGIC_PLACEHOLDER_CLASS}`]: {
    border: '1px solid var(--jp-brand-color0)',
    borderRadius: '4px',
    color: 'var(--jp-brand-color0)',
    padding: '0 3px',
    background: 'var(--jp-brand-color4)'
  }
});

/**
 * SQL magic placeholder
 */
class SqlMagicPlaceholderWidget extends WidgetType {
  /**
   * Initialize the SQL magic placeholder
   *
   * @param name Placeholder text
   */
  constructor(public name: string) {
    super();
    this.name = name;
  }
  eq(other: SqlMagicPlaceholderWidget) {
    return this.name == other.name;
  }
  toDOM() {
    let elt = document.createElement('span');
    elt.className = SQL_MAGIC_PLACEHOLDER_CLASS;
    elt.textContent = this.name;
    return elt;
  }
  ignoreEvent() {
    return false;
  }
}

/**
 * Match decorator for the SQL magic
 */
const magicMatcher = new MatchDecorator({
  // Regexp to match the magic command
  // it is tested for every line and I did not find a way to only apply it to the first
  regexp: /^(%%sql|%%sql\s.*)$/g,
  decoration: (match, view, pos) =>
    // Only apply the decoration to the first line - workaround to the limitation of the regexp
    pos == 0
      ? Decoration.replace({
          widget: new SqlMagicPlaceholderWidget('SQL')
        })
      : null,
  // Optimization to reduce updates
  maxLength: 1
});

/**
 * Plugin to inject SQL magic placeholder into CodeMirror editors.
 */
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
    provide: plugin => [
      EditorView.atomicRanges.of(view => {
        return view.plugin(plugin)?.hideSqlMagic || Decoration.none;
      }),
      sqlMagicTheme
    ]
  }
);
