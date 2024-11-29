import type { WidgetTracker } from '@jupyterlab/apputils';
import { Token } from '@lumino/coreutils';

export const IChatTracker = new Token<WidgetTracker>(
  'mito-ai/IChatTracker',
  'Widget tracker for the chat sidebar.'
);
