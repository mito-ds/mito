import type { WidgetTracker } from '@jupyterlab/apputils';
import { Token } from '@lumino/coreutils';

/* 
Because other extensions rely on the Chat plugin, we need to make sure that the 
Chat plugin is loaded before these other extensions. 

For example, the emptyCell extension relies on the Chat plugin in order to 
find the keybindings associated with the COMMAND_MITO_AI_OPEN_CHAT command. 

By providing a chat plugin token, we can require it from the other extensions. 
This makes sure that the chat plugin is loaded before these other extensions. 
*/

export const IChatTracker = new Token<WidgetTracker>(
  'mito-ai/IChatTracker',
  'Widget tracker for the chat sidebar.'
);
