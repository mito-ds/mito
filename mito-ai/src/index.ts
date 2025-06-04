/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import AiChatPlugin from './Extensions/AiChat/AiChatPlugin';
import ContextManagerPlugin from './Extensions/ContextManager/ContextManagerPlugin';
import ErrorMimeRendererPlugin from './Extensions/ErrorMimeRenderer/ErrorMimeRendererPlugin';
import ToolbarButtonsPlugin from './Extensions/ToolbarButtons/ToolbarButtonsPlugin';
import AppBuilderPlugin from './Extensions/AppBuilder/AppBuilderPlugin';
import { emptyCellPlaceholder } from './Extensions/emptyCell/EmptyCellPlugin';
import { completionPlugin } from './Extensions/InlineCompleter';
import { statusItem } from './Extensions/status';
import SettingsManagerPlugin from './Extensions/SettingsManager/SettingsManagerPlugin';
import { versionCheckPlugin } from './Extensions/VersionCheck';
import NotebookFooterPlugin from './Extensions/NotebookFooter';

// This is the main entry point to the mito-ai extension. It must export all of the top level
// extensions that we want to load.
export default [
  AiChatPlugin,
  ErrorMimeRendererPlugin,
  ContextManagerPlugin,
  AppBuilderPlugin,
  ToolbarButtonsPlugin,
  emptyCellPlaceholder,
  completionPlugin,
  statusItem,
  SettingsManagerPlugin,
  versionCheckPlugin,
  NotebookFooterPlugin
];
