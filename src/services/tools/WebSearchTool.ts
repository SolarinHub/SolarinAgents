import { toolRegistry, type BuiltinTool } from './ToolRegistry';

const WEB_SEARCH_TOOL: BuiltinTool = {
  type: 'web_search_preview',
};

export const registerWebSearch = (): void => {
  toolRegistry.registerBuiltin('web_search_preview', WEB_SEARCH_TOOL);
};

export const unregisterWebSearch = (): void => {
  toolRegistry.unregister('web_search_preview');
};
