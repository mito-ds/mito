import { JupyterFrontEndPlugin } from '@jupyterlab/application';
import type { WidgetTracker } from '@jupyterlab/apputils';
import { IStatusBar, Popup, showPopup } from '@jupyterlab/statusbar';
import {
  Button,
  ReactWidget,
  VDomModel,
  VDomRenderer
} from '@jupyterlab/ui-components';
import React from 'react';
import { NucleusLabIcon } from '../../icons';
import type {
  ErrorMessage,
  IAICapabilities
} from '../../utils/websocket/models';
import { IChatTracker, type IChatWidget } from '../AiChat/token';

/**
 * Mito AI status model
 */
class StatusModel extends VDomModel {
  protected _capabilities?: IAICapabilities;
  protected _lastError?: ErrorMessage;

  constructor(protected chatPanel: IChatWidget) {
    super();
    chatPanel.capabilitiesChanged.connect(this._onCapabilitiesChanged, this);
    chatPanel.lastErrorChanged.connect(this._onLastErrorChanged, this);
  }

  /**
   * AI capabilities.
   */
  get capabilities(): IAICapabilities | undefined {
    return this._capabilities;
  }

  /**
   * Latest seen error.
   */
  get lastError(): ErrorMessage | undefined {
    return this._lastError;
  }

  protected _onCapabilitiesChanged(
    _: IChatWidget,
    capabilities: IAICapabilities
  ): void {
    this._capabilities = capabilities;
    this.stateChanged.emit(void 0);
  }

  protected _onLastErrorChanged(_: IChatWidget, error: ErrorMessage): void {
    this._lastError = error.error_type ? error : undefined;
    this.stateChanged.emit(void 0);
  }
}

/**
 * Mito AI status popup.
 */
class StatusPopUp extends VDomRenderer<StatusModel> {
  protected render(): JSX.Element {
    return (
      <div className="mito-ai-status-popup">
        <h4>Mito AI Status</h4>
        <p>Provider: {this.model.capabilities?.provider ?? 'None'}</p>
        {this.model.capabilities && (
          <>
            <p>Configuration:</p>
            <ul>
              <li>Model: {this.model.capabilities.configuration['model']}</li>
              <li>
                Max tokens:{' '}
                {this.model.capabilities.configuration[
                  'max_completion_tokens'
                ] ?? 'undefined'}
              </li>
              <li>
                Temperature:{' '}
                {this.model.capabilities.configuration['temperature']}
              </li>
            </ul>
          </>
        )}
        {this.model.lastError && (
          <>
            <p>Last error:</p>
            <ul>
              <li>Type: {this.model.lastError.error_type}</li>
              <li>Title: {this.model.lastError.title}</li>
              {this.model.lastError.hint && (
                <li>Hint: {this.model.lastError.hint}</li>
              )}
            </ul>
          </>
        )}
      </div>
    );
  }
}

const MITO_AI_ERROR_CLASS = 'mito-ai-error';

/**
 * Mito widget to display in the status bar.
 */
class StatusItem extends ReactWidget {
  private _hasError: boolean = false;
  private _popup: Popup | null = null;

  constructor(protected model: StatusModel) {
    super();
    model.stateChanged.connect(this._onLastErrorChanged, this);
  }

  render(): JSX.Element {
    return (
      <Button
        className="mito-ai-status-button"
        onClick={() => {
          this._onClick();
        }}
        minimal
        small
        title="Mito AI Status"
      >
        Mito AI &nbsp; <NucleusLabIcon.react tag={'span'} stylesheet={'statusBar'} />
      </Button>
    );
  }

  protected _onLastErrorChanged(): void {
    if (this.model.lastError) {
      this._hasError = true;
      this.node.querySelector('button')?.classList.add(MITO_AI_ERROR_CLASS);
    } else {
      if (this._hasError) {
        this._hasError = false;
        this.node
          .querySelector('button')
          ?.classList.remove(MITO_AI_ERROR_CLASS);
      }
    }
  }

  protected _onClick(): void {
    if (this._popup && !this._popup.isDisposed) {
      this._popup.dispose();
    } else {
      this._popup = showPopup({
        body: new StatusPopUp(this.model),
        anchor: this,
        align: 'right',
        hasDynamicSize: true
      });
    }
  }
}

export const statusItem: JupyterFrontEndPlugin<void> = {
  id: 'mito_ai:status-item',
  autoStart: true,
  requires: [IChatTracker, IStatusBar],
  activate: (
    app,
    chatTracker: WidgetTracker<IChatWidget>,
    statusBar: IStatusBar
  ) => {
    let registered = false;
    const registerMitoStatus = (chatPanel: IChatWidget) => {
      if (registered) {
        return;
      }
      registered = true;
      const model = new StatusModel(chatPanel);

      const renderer = new StatusItem(model);

      statusBar.registerStatusItem('mito-ai:status-item', {
        item: renderer,
        align: 'right',
        rank: 0
      });
    };

    if (chatTracker.currentWidget) {
      registerMitoStatus(chatTracker.currentWidget);
    } else {
      chatTracker.widgetAdded.connect((_, chatPanel) => {
        registerMitoStatus(chatPanel);
      });
    }
  }
};
