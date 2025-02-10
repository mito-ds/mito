import { Button, Skeleton } from '@jupyter/react-components';
import { ObservableList, type IObservableList } from '@jupyterlab/observables';
import {
  ReactWidget,
  SidePanel,
  addIcon,
  deleteIcon,
  closeIcon
} from '@jupyterlab/ui-components';
import { map } from '@lumino/algorithm';
import type { CommandRegistry } from '@lumino/commands';
import { JSONExt } from '@lumino/coreutils';
import { Panel } from '@lumino/widgets';
import * as React from 'react';
import { requestAPI } from './handler';
import { Signal, type ISignal } from '@lumino/signaling';
import { DRIVER_TO_TYPE } from './addsource';
import { CommandIDs, type ISqlSource, type ISqlSources } from './tokens';

/**
 * SQL sources model.
 */
export class SqlSourcesModel
  extends ObservableList<ISqlSource>
  implements ISqlSources
{
  protected _isRefreshing: boolean;
  protected _configurationFile: string;
  private _isReady: boolean;
  private _error: string;
  private _stateChanged: Signal<ISqlSources, string>;

  constructor() {
    super({
      itemCmp: (a, b) => JSONExt.deepEqual(a as any, b as any)
    });
    this._configurationFile = '';
    this._error = '';
    this._stateChanged = new Signal<ISqlSources, string>(this);
    this._isReady = false;
    this._isRefreshing = false;

    this.changed.connect(this.updateSource, this);
  }

  /**
   * SQL connections configuration file.
   */
  get configurationFile(): string {
    return this._configurationFile;
  }

  /**
   * Error message if any.
   */
  get error(): string {
    return this._error;
  }
  set error(value: string) {
    if (this._error !== value) {
      this._error = value;
      this._stateChanged.emit('error');
    }
  }

  /**
   * Signal emitted when the model changes.
   */
  get stateChanged(): ISignal<ISqlSources, string> {
    return this._stateChanged;
  }

  /**
   * Whether the model is ready; i.e. the initial fetch has completed.
   */
  get isReady(): boolean {
    return this._isReady;
  }

  /**
   * Dispose the model resources.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this.changed.disconnect(this.updateSource, this);
    Signal.disconnectAll(this);
    super.dispose();
  }

  /**
   * Refresh the model with the stored SQL sources.
   */
  async refresh(): Promise<void> {
    try {
      this._isRefreshing = true;
      const [sources, ] = await Promise.all([requestAPI<{
        connections: ISqlSource[];
        configurationFile: string;
      }>('databases'),
      sleep(500)
    ]);
      this.error = '';
      this.clear();
      this.pushAll(sources.connections);
      this._configurationFile = sources.configurationFile;
      this._stateChanged.emit('sources');
      this._stateChanged.emit('configurationFile');
    } catch (reason) {
      console.error('Failed to fetch SQL sources', reason);
      this.error = 'Failed to fetch SQL sources';
    } finally {
      this._isRefreshing = false;
      this._isReady = true;
      this._stateChanged.emit('isReady');
    }
  }

  /**
   * Update the sources in the backend.
   */
  protected async updateSource(
    list: IObservableList<ISqlSource>,
    changes: IObservableList.IChangedArgs<ISqlSource>
  ): Promise<void> {
    if (this._isRefreshing) {
      return;
    }

    switch (changes.type) {
      case 'add':
        {
          const v = await Promise.allSettled(
            changes.newValues.map(source =>
              requestAPI<void>('databases', {
                method: 'POST',
                body: JSON.stringify(source)
              })
            )
          );
          this.error =
            (
              v.find(p => p.status === 'rejected') as
                | PromiseRejectedResult
                | undefined
            )?.reason ?? '';
        }
        break;
      case 'move':
        // no-op
        break;
      case 'remove':
        {
          const v = await Promise.allSettled(
            changes.oldValues.map(source =>
              requestAPI<void>(`databases/${source.connectionName}`, {
                method: 'DELETE'
              })
            )
          );
          this.error =
            (
              v.find(p => p.status === 'rejected') as
                | PromiseRejectedResult
                | undefined
            )?.reason ?? '';
        }
        break;
      case 'set':
        {
          const v = await Promise.allSettled(
            changes.newValues.map(source =>
              requestAPI<void>(`databases/${source.connectionName}`, {
                method: 'PATCH',
                body: JSON.stringify(source)
              })
            )
          );
          this.error =
            (
              v.find(p => p.status === 'rejected') as
                | PromiseRejectedResult
                | undefined
            )?.reason ?? '';
        }
        break;
    }

    this._stateChanged.emit('sources');
  }
}

/**
 * SQL source list components properties.
 */
interface ISqlSourceListProps {
  /**
   * Application commands registry.
   */
  commands: CommandRegistry;
  /**
   * SQL sources model.
   */
  model: ISqlSources;
}

/**
 * SQL sources placeholder component.
 */
function SqlSourcesPlaceholder({
  commands
}: {
  commands: CommandRegistry;
}): JSX.Element {
  const onClick = React.useCallback(() => {
    commands.execute(CommandIDs.addSource);
  }, [commands]);
  return (
    <div>
      <div>
        <h3>No SQL sources</h3>
        <p>
          This panel shows the SQL databases you can connect to within
          notebooks.
        </p>
        <Button appearance="accent" onClick={onClick} scale="small">
          <addIcon.react tag={null} />
          Add a SQL source
        </Button>
      </div>
    </div>
  );
}

/**
 * SQL sources error component.
 */
function SqlSourcesError({
  model
}: {
  model: ISqlSources;
}): JSX.Element | null {
  const [error, setError] = React.useState(model.error);

  React.useEffect(() => {
    const listener = (sender: ISqlSources, state: string) => {
      if (state === 'error') {
        setError(error);
      }
    };
    model.stateChanged.connect(listener);
    return () => {
      model.stateChanged.disconnect(listener);
    };
  }, [model]);

  const dismiss = React.useCallback(() => {
    setError('');
  }, []);

  return error ? (
    <div className="mito-sql-error-message">
      <Button
        className="mito-sql-btn-error-message-dismiss"
        appearance="stealth"
        onClick={dismiss}
      >
        <closeIcon.react tag={null} />
      </Button>
      {error}
    </div>
  ) : null;
}

function SqlSources(props: ISqlSourceListProps): JSX.Element {
  const { commands, model } = props;
  const [sources, setSources] = React.useState<ISqlSource[]>(
    Array.from(map(model, s => s))
  );

  React.useEffect(() => {
    const listener = () => {
      setSources(Array.from(map(model, s => s)));
    };
    model.changed.connect(listener);
    return () => {
      model.changed.disconnect(listener);
    };
  }, [model]);

  return (
    <ul className="mito-sql-sources-list">
      {sources.map(source => (
        <li className="mito-sql-source-item" key={source.connectionName}>
          <span className="mito-sql-source-name">{source.connectionName}</span>
          <br />
          <span className="mito-sql-source-database">
            {DRIVER_TO_TYPE[source.driver]}: {source.database}
          </span>
          <Button
            className="mito-sql-btn-source-delete"
            appearance="stealth"
            onClick={() => {
              commands.execute('mito-sql-cell:delete-source', {
                name: source.connectionName
              });
            }}
          >
            <deleteIcon.react tag={null} />
          </Button>
        </li>
      ))}
    </ul>
  );
}

function SqlSourceList(props: ISqlSourceListProps): JSX.Element {
  const [isReady, setIsReady] = React.useState(props.model.isReady);
  const [nSources, setNSources] = React.useState(props.model.length);
  React.useEffect(() => {
    const listener = (sender: ISqlSources, changes: string) => {
      switch (changes) {
        case 'isReady':
          setIsReady(sender.isReady);
          break;
        case 'sources':
          setNSources(sender.length);
          break;
      }
    };
    props.model.stateChanged.connect(listener);
    return () => {
      props.model.stateChanged.disconnect(listener);
    };
  }, [props.model]);
  return (
    <>
      <SqlSourcesError model={props.model} />
      {isReady ? (
        nSources > 0 ? (
          <SqlSources {...props} />
        ) : (
          <SqlSourcesPlaceholder commands={props.commands} />
        )
      ) : (
        <>
          <Skeleton
            style={{ borderRadius: '4px', margin: '4px', height: '24px' }}
            shimmer
            shape="rect"
          />
          <Skeleton
            style={{ borderRadius: '4px', margin: '4px', height: '24px' }}
            shimmer
            shape="rect"
          />
          <Skeleton
            style={{ borderRadius: '4px', margin: '4px', height: '24px' }}
            shimmer
            shape="rect"
          />
        </>
      )}
    </>
  );
}

/**
 * SQL sources side panel.
 */
export class SqlSourcesPanel extends SidePanel {
  constructor({ model, commands }: ISqlSourceListProps) {
    super({ content: new Panel() });
    this.addClass('mito-sql-sources-panel');
    this.content.addWidget(
      ReactWidget.create(<SqlSourceList commands={commands} model={model} />)
    );
  }
}



// A helper function for sleeping for a number of seconds
const sleep = async (timeoutInMilliseconds: number): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, timeoutInMilliseconds));
}