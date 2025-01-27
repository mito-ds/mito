import * as React from 'react';
import { ReactWidget, SidePanel, addIcon } from '@jupyterlab/ui-components';
import { Panel } from '@lumino/widgets';
import { Button } from '@jupyter/react-components';
import type { CommandRegistry } from '@lumino/commands';

export interface ISqlSources {
  sources: string[];
}

interface ISqlSourceListProps {
  commands: CommandRegistry;
  model: ISqlSources;
}

function SqlSourcesPlaceholder({
  commands
}: {
  commands: CommandRegistry;
}): JSX.Element {
  const onClick = React.useCallback(() => {
    commands.execute('mito-sql-cell:add-source');
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

function SqlSources(props: ISqlSourceListProps): JSX.Element {
  return <ul></ul>
}


function SqlSourceList(props: ISqlSourceListProps): JSX.Element {
  return props.model.sources.length > 0 ? (
    <SqlSourcesPlaceholder commands={props.commands} />
  ) : null;
}

export class SqlSourcesPanel extends SidePanel {
  constructor({
    model,
    commands
  }: {
    model: ISqlSources;
    commands: CommandRegistry;
  }) {
    super({ content: new Panel() });
    this.addClass('mito-sql-sources-panel');
    this.content.addWidget(ReactWidget.create(<SqlSourceList model={model} />));
  }
}
