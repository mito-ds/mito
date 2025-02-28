import { Option, Select, TextField, Toolbar } from '@jupyter/react-components';
import { CellChange } from '@jupyter/ydoc';
import { type ICellModel, type ICodeCellModel } from '@jupyterlab/cells';
import { addIcon, editIcon, ReactWidget } from '@jupyterlab/ui-components';
import type { CommandRegistry } from '@lumino/commands';
import * as React from 'react';
import { CommandIDs } from './commands';
import { MagicLine } from './magicLineUtils';
import { type ISqlSources } from './tokens';
import type { Widget } from '@lumino/widgets';

/**
 * The class of the toolbar.
 */
const TOOLBAR_CLASS = 'mito-sqlcell-toolbar';
const ADD_SOURCE_OPTION_VALUE = 'add-source';

/**
 * SQL cell toolbar properties
 */
export interface ISQLCellToolbarProps {
  /**
   * Command registry
   */
  commands: CommandRegistry;
  /**
   * Cell model
   */
  model: ICellModel;
  /**
   * Callback when the isSQL state changes.
   *
   * @param isSQL Whether the cell is a SQL cell or not
   */
  onIsSQLChanged: (isSQL: boolean) => void;
  /**
   * SQL sources
   */
  sqlSources: ISqlSources;
}

/**
 * SQL cell toolbar component.
 */
function SQLCellToolbar(props: ISQLCellToolbarProps): JSX.Element | null {
  const { commands, model, onIsSQLChanged, sqlSources } = props;
  const [sources, setSources] = React.useState<string[]>([]);
  const [isSQL, setIsSQL] = React.useState<boolean>(false);
  const [connectionName, setConnectionName] = React.useState<string>('');
  const [variableName, setVariableName] = React.useState<string>('');

  // Read SQL configuration from cell content
  React.useEffect(() => {
    /**
     * Callback on shared model change.
     *
     * When the cell content changes, we need to parse it again as it may add/remove the magic line.
     */
    const onSharedModelChanged = (_: any, change: CellChange) => {
      if (model.type !== 'code') {
        setIsSQL(false);
        return;
      }

      // Extract the magic line from the cell content
      const updateComponentState = () => {
        const magic =
          model.type === 'code'
            ? MagicLine.getSQLMagic(model as ICodeCellModel)
            : null;

        if (magic?.isSQL) {
          setIsSQL(true);
          setConnectionName(magic.options['--section'] ?? '');
          setVariableName(magic.output ?? '');
        } else {
          setIsSQL(false);
          setConnectionName('');
          setVariableName('');
        }
      };

      // Avoid triggering the parsing of the cell too often by filtering
      // on the change position.
      if (change.sourceChange) {
        const firstLineLength = model.sharedModel.source.indexOf('\n');

        if (firstLineLength === -1) {
          updateComponentState();
        } else {
          // If an object with the key 'retain' exists, it will give the position of the
          // change. Otherwise we assume the change occurs at position 0;
          const position =
            change.sourceChange.find(change => change.retain !== undefined)
              ?.retain || 0;

          // Check if the change occurs on the first line to update header and widgets.
          if (position <= firstLineLength) {
            updateComponentState();
          }
        }
      }
    };

    // Initialize the component state
    onSharedModelChanged(model.sharedModel, { sourceChange: [] });

    model.sharedModel.changed.connect(onSharedModelChanged);
    return () => {
      try {
        model.sharedModel?.changed.disconnect(onSharedModelChanged);
      } catch (e) {
        /* Disconnecting the signal may failed on cell disposal as the object will be deleted. */
      }
    };
  }, [model]);

  // Notify the parent component when the isSQL state changes
  React.useEffect(() => {
    onIsSQLChanged(isSQL);
  }, [isSQL, onIsSQLChanged]);

  // Update sources list from connections model
  React.useEffect(() => {
    const onSQLSourcesChanged = () => {
      if (isSQL) {
        setSources(Array.from(sqlSources).map(s => s.connectionName));
      }
    };
    // Initialize the list of sources
    onSQLSourcesChanged();

    // Listen for changes
    sqlSources.changed.connect(onSQLSourcesChanged);

    return () => {
      sqlSources.changed.disconnect(onSQLSourcesChanged);
    };
  }, [isSQL, sqlSources]);

  // Update the cell magic line when the database or variable name changes.
  React.useEffect(() => {
    const magic =
      model.type === 'code'
        ? MagicLine.getSQLMagic(model as ICodeCellModel)
        : null;

    if (magic) {
      // Clear args and options to avoid unsupported combinations.
      magic.args = [];
      magic.options = magic.options['--section']
        ? {
            '--section': magic.options['--section']
          }
        : {};

      let needsUpdate = false;
      // Set undefined if variableName is empty string
      const newOutput = variableName || undefined;
      if (magic.output !== newOutput) {
        magic.output = newOutput;
        needsUpdate = true;
      }
      if (magic.options['--section'] !== connectionName) {
        if (connectionName) {
          magic.options['--section'] = connectionName;
        } else {
          delete magic.options['--section'];
        }
        needsUpdate = true;
      }
      if (needsUpdate) {
        MagicLine.update(model as ICodeCellModel, magic);
      }
    }
  }, [connectionName, model, variableName]);

  const onDatabaseChange = React.useCallback((event: any) => {
    if (event.target.value !== ADD_SOURCE_OPTION_VALUE) {
      setConnectionName(event.target.value);
    }
  }, []);

  const onVariableChange = React.useCallback((event: any) => {
    setVariableName(event.target.value);
  }, []);

  const addDatabase = React.useCallback(async () => {
    const newSource = await commands.execute(CommandIDs.addSource);
    const value = newSource?.connectionName;
    if (value) {
      setConnectionName(value);
    }
  }, [commands]);

  return isSQL ? (
    <Toolbar className={TOOLBAR_CLASS} aria-label="Cell SQL toolbar">
      <span style={{ margin: 'auto var(--toolbar-item-gap)' }}>Querying</span>
      <Select
        title="SQL source"
        onChange={onDatabaseChange}
        scale="xsmall"
        value={connectionName}
      >
        <Option
          key="add"
          className="mito-sql-add-option"
          value={ADD_SOURCE_OPTION_VALUE}
          onClick={addDatabase}
        >
          <addIcon.react tag={null} slot="start" />
          Create new database connection
        </Option>
        {sources.map(connectionName => (
          <Option key={connectionName} value={connectionName}>
            {connectionName}
          </Option>
        ))}
      </Select>
      <span style={{ margin: 'auto var(--toolbar-item-gap)' }}>
        and saving the results to variable
      </span>
      <TextField
        aria-label="Variable name"
        title="Variable name"
        onInput={onVariableChange}
        onChange={onVariableChange}
        placeholder="Variable name"
        value={variableName}
      >
        <editIcon.react slot="end" tag={null} />
      </TextField>
    </Toolbar>
  ) : null;
}

/**
 * Create a SQL cell toolbar component wrapped in a widget.
 */
export function createSQLCellToolbar(props: ISQLCellToolbarProps): Widget {
  return ReactWidget.create(<SQLCellToolbar {...props} />);
}
