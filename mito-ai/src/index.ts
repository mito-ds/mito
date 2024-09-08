
import AiChatPlugin from './Extensions/AiChat/AiChatPlugin';
import VariableManagerPlugin from './Extensions/VariableManager/VariableManagerPlugin';
import ErrorMimeRendererPlugin from './Extensions/ErrorMimeRenderer/ErrorMimeRendererPlugin';

// This is the main entry point to the mito-ai extension. It must export all of the top level 
// extensions that we want to load.
export default [AiChatPlugin, ErrorMimeRendererPlugin, VariableManagerPlugin];


