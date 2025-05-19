/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import type { WidgetTracker } from '@jupyterlab/apputils';
import { Token } from '@lumino/coreutils';
import type { ISignal } from '@lumino/signaling';
import type { Widget } from '@lumino/widgets';
import type {
  ErrorMessage,
  IAICapabilities
} from '../../websockets/completions/CompletionModels';

/**
 * The chat panel interface.
 */
export type IChatWidget = Widget & {
  /**
   * Signal emitted when the capabilities of the AI provider changes.
   */
  readonly capabilitiesChanged: ISignal<IChatWidget, IAICapabilities>;
  /**
   * Signal emitted when the last error of the AI provider changes.
   */
  readonly lastErrorChanged: ISignal<IChatWidget, ErrorMessage>;
};

/* 
Because other extensions rely on the Chat plugin, we need to make sure that the 
Chat plugin is loaded before these other extensions. 

For example, the emptyCell extension relies on the Chat plugin in order to 
find the keybindings associated with the COMMAND_MITO_AI_OPEN_CHAT command. 

By providing a chat plugin token, we can require it from the other extensions. 
This makes sure that the chat plugin is loaded before these other extensions. 
*/

export const IChatTracker = new Token<WidgetTracker<IChatWidget>>(
  'mito-ai/IChatTracker',
  'Widget tracker for the chat sidebar.'
);
