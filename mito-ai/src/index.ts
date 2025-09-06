/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import AiChatPlugin from './Extensions/AiChat/AiChatPlugin';
import ContextManagerPlugin from './Extensions/ContextManager/ContextManagerPlugin';
import ErrorMimeRendererPlugin from './Extensions/ErrorMimeRenderer/ErrorMimeRendererPlugin';
import ToolbarButtonsPlugin from './Extensions/ToolbarButtons/ToolbarButtonsPlugin';
import AppDeployPlugin from './Extensions/AppDeploy/AppDeployPlugin';
import StreamlitPreviewPlugin from './Extensions/AppPreview/StreamlitPreviewPlugin';
import { emptyCellPlaceholder } from './Extensions/emptyCell/EmptyCellPlugin';
import { statusItem } from './Extensions/status';
import SettingsManagerPlugin from './Extensions/SettingsManager/SettingsManagerPlugin';
import { versionCheckPlugin } from './Extensions/VersionCheck';
import NotebookFooterPlugin from './Extensions/NotebookFooter';
import ManageAppsPlugin from "./Extensions/AppManager/ManageAppsPlugin"

// This is the main entry point to the mito-ai extension. It must export all of the top level
// extensions that we want to load.
export default [
  AiChatPlugin,
  ErrorMimeRendererPlugin,
  ContextManagerPlugin,
  AppDeployPlugin,
  StreamlitPreviewPlugin,
  ToolbarButtonsPlugin,
  emptyCellPlaceholder,
  statusItem,
  SettingsManagerPlugin,
  versionCheckPlugin,
  NotebookFooterPlugin,
  ManageAppsPlugin
];
