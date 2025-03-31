/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import AiChatPlugin from './Extensions/AiChat/AiChatPlugin';
import ContextManagerPlugin from './Extensions/ContextManager/ContextManagerPlugin';
import ErrorMimeRendererPlugin from './Extensions/ErrorMimeRenderer/ErrorMimeRendererPlugin';
import CellToolbarButtonsPlugin from './Extensions/CellToolbarButtons/CellToolbarButtonsPlugin';
import { emptyCellPlaceholder } from './Extensions/emptyCell/EmptyCellPlugin';
import { completionPlugin } from './Extensions/InlineCompleter';
import { statusItem } from './Extensions/status';

// This is the main entry point to the mito-ai extension. It must export all of the top level
// extensions that we want to load.
export default [
  AiChatPlugin,
  ErrorMimeRendererPlugin,
  ContextManagerPlugin,
  CellToolbarButtonsPlugin,
  emptyCellPlaceholder,
  completionPlugin,
  statusItem
];
