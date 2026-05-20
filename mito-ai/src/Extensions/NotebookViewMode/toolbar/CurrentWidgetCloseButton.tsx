/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { ReactWidget } from '@jupyterlab/ui-components';
import { Message } from '@lumino/messaging';
import { Widget } from '@lumino/widgets';
import XMarkIcon from '../../../icons/XMark';
import {
  CLOSE_CURRENT_WIDGET_COMMAND,
  getCurrentWidgetDisplayName,
  getSelectedMainAreaTabLabel
} from '../mitoToolbarWidgetUtils';

interface ICurrentWidgetCloseButtonContentProps {
  widgetName: string;
  onClose: () => void;
}

const CurrentWidgetCloseButtonContent: React.FC<ICurrentWidgetCloseButtonContentProps> = ({
  widgetName,
  onClose
}) => {
  return (
    <button
      type="button"
      className="mito-top-toolbar-close-button"
      aria-label={`Close ${widgetName}`}
      title={`Close ${widgetName}`}
      onClick={onClose}
    >
      <XMarkIcon fill="currentColor" width="9" height="9" />
    </button>
  );
};

export class CurrentWidgetCloseButton extends ReactWidget {
  constructor(
    private readonly app: JupyterFrontEnd,
    private readonly getCurrentWidget: () => Widget | null
  ) {
    super();
    this.addClass('mito-top-toolbar-close-widget');
    this.addClass('mito-top-toolbar-left-close-widget');
  }

  onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    requestAnimationFrame(() => this.update());
    window.setTimeout(() => this.update(), 500);
  }

  render(): JSX.Element | null {
    const widget = this.getCurrentWidget();
    const selectedTabLabel = getSelectedMainAreaTabLabel();
    const canCloseSelectedTab =
      Boolean(selectedTabLabel) && this.app.commands.hasCommand(CLOSE_CURRENT_WIDGET_COMMAND);
    if (!widget?.title.closable && !canCloseSelectedTab) {
      return null;
    }

    return (
      <CurrentWidgetCloseButtonContent
        widgetName={getCurrentWidgetDisplayName(widget)}
        onClose={this._closeCurrentWidget}
      />
    );
  }

  private _closeCurrentWidget = (): void => {
    const widget = this.getCurrentWidget();
    if (widget?.title.closable) {
      widget.close();
    } else {
      void this.app.commands.execute(CLOSE_CURRENT_WIDGET_COMMAND);
    }
    this.update();
  };
}
