import AiChatPlugin from './Extensions/AiChat/AiChatPlugin';
import VariableManagerPlugin from './Extensions/VariableManager/VariableManagerPlugin';
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
  VariableManagerPlugin,
  CellToolbarButtonsPlugin,
  emptyCellPlaceholder,
  completionPlugin,
  statusItem
];
