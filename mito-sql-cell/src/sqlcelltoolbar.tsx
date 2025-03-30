import { TextField, Toolbar } from '@jupyter/react-components';
import { CellChange } from '@jupyter/ydoc';
import { type ICellModel, type ICodeCellModel } from '@jupyterlab/cells';
import { editIcon, HTMLSelect, ReactWidget } from '@jupyterlab/ui-components';
import type { CommandRegistry } from '@lumino/commands';
import type { Widget } from '@lumino/widgets';
import * as React from 'react';
import { CommandIDs } from './commands';
import { MagicLine } from './magicLineUtils';
import { type ISqlSources } from './tokens';

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
          setConnectionName(magic.connectionName ?? '');
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
  const updateCellMagic = React.useCallback(
    (connectionName: string, model: ICellModel, variableName: string) => {
      const magic =
        model.type === 'code'
          ? MagicLine.getSQLMagic(model as ICodeCellModel)
          : null;

      if (magic) {
        const newMagic = {
          isSQL: true,
          connectionName: '',
          configurationFile: sqlSources.configurationFile
        } as MagicLine.ISQLMagic;

        let needsUpdate = false;
        // Set undefined if variableName is empty string
        const newOutput = variableName || undefined;
        if (newMagic.output !== newOutput) {
          newMagic.output = newOutput;
          needsUpdate = true;
        }
        // Set undefined if connectionName is empty string to
        // match the missing value
        const newConnection = connectionName || undefined;
        if (newMagic.connectionName !== newConnection) {
          if (newConnection) {
            newMagic.connectionName = newConnection;
          }
          needsUpdate = true;
        }
        if (needsUpdate) {
          MagicLine.update(model as ICodeCellModel, newMagic);
        }
      }
    },
    []
  );

  const addDatabase = React.useCallback(
    async (event: any) => {
      if (event.target.value !== ADD_SOURCE_OPTION_VALUE) return;
      const newSource = await commands.execute(CommandIDs.addSource);
      const value = newSource?.connectionName;
      if (value) {
        setConnectionName(value);
        updateCellMagic(value, model, variableName);
      }
    },
    [commands, model, variableName]
  );

  const onConnectionChange = React.useCallback(
    (event: any) => {
      if (event.target.value !== ADD_SOURCE_OPTION_VALUE) {
        setConnectionName(event.target.value);
        updateCellMagic(event.target.value, model, variableName);
      } else {
        addDatabase(event);
      }
    },
    [model, variableName]
  );

  const onVariableChange = React.useCallback(
    (event: any) => {
      setVariableName(event.target.value);
      updateCellMagic(connectionName, model, event.target.value);
    },
    [connectionName, model]
  );

  return isSQL ? (
    <Toolbar className={TOOLBAR_CLASS} aria-label="Cell SQL toolbar">
      <span style={{ margin: 'auto var(--toolbar-item-gap)' }}>Connected to</span>
      <HTMLSelect
        title="SQL source"
        onChange={onConnectionChange}
        value={connectionName}
        onClick={addDatabase}
      >
        {sources.map(source => (
          <option key={source} value={source}>
            {source}
          </option>
        ))}
        <option key="add" value={ADD_SOURCE_OPTION_VALUE}>
          + Create new connection
        </option>
      </HTMLSelect>
      <span style={{ margin: 'auto var(--toolbar-item-gap)' }}>
        saving to df
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
