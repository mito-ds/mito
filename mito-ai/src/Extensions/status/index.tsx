/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

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
import type { ErrorMessage, IAICapabilities } from '../../websockets/completions/CompletionModels';
import { IChatTracker, type IChatWidget } from '../AiChat/token';
import { FREE_TIER_LIMIT_REACHED_ERROR_TITLE } from '../../utils/errors';
import TextButton from '../../components/TextButton';
import { STRIPE_PAYMENT_LINK } from '../../utils/stripe';

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

    let status_paragraph = <p className='mito-ai-status-ready'>Ready</p>
    if (this.model.lastError?.title == FREE_TIER_LIMIT_REACHED_ERROR_TITLE) {
      status_paragraph = <p className='mito-ai-status-error'>Free Trial Expired</p>
    }

    return (
      <div className="mito-ai-status-popup">
        <h3>Mito AI Status</h3>
        <div className='mito-ai-status-popup-table-row'>
          <p>Status:</p>
          {status_paragraph}
        </div>
        <div className='mito-ai-status-popup-table-row'>
          <p>Provider:</p>
          <p>{this.model.capabilities?.provider ?? 'None'}</p>
        </div>
        {this.model.lastError?.title == FREE_TIER_LIMIT_REACHED_ERROR_TITLE && (
          <>
            <p>
              ⚠️ You&apos;ve used up your free Mito AI completions for this month. Upgrade to <a href="https://www.trymito.io/plans" target="_blank" rel="noreferrer">Mito Pro</a> or supply your own Open AI Key to continue using Mito AI.
            </p>
            <TextButton
              title="Upgrade to Pro"
              text="Upgrade to Pro"
              action={STRIPE_PAYMENT_LINK}
              variant='gray'
              width='block'
            />
          </>
        )}
        {this.model.lastError && this.model.lastError.title !== FREE_TIER_LIMIT_REACHED_ERROR_TITLE && (
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
    
    const registerMitoStatus = (chatPanel: IChatWidget): void => {
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
