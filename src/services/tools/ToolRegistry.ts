export type ToolParam = {
  type: string;
  description?: string;
  enum?: string[];
};

export type ToolSchema = {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, ToolParam>;
      required?: string[];
    };
  };
};

export type BuiltinTool = {
  type: string;
};

export type Tool = ToolSchema | BuiltinTool;

export type ToolCall = {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
};

export type ToolResult = {
  toolCallId: string;
  content: string;
};

type RegisteredTool = {
  schema: ToolSchema;
  execute: (args: Record<string, any>) => Promise<string>;
};

class ToolRegistryClass {
  private tools = new Map<string, RegisteredTool>();
  private builtins = new Map<string, BuiltinTool>();

  register(name: string, schema: ToolSchema, execute: (args: Record<string, any>) => Promise<string>): void {
    this.tools.set(name, { schema, execute });
  }

  registerBuiltin(name: string, tool: BuiltinTool): void {
    this.builtins.set(name, tool);
  }

  unregister(name: string): void {
    this.tools.delete(name);
    this.builtins.delete(name);
  }

  getSchema(name: string): ToolSchema | undefined {
    return this.tools.get(name)?.schema;
  }

  getExecutor(name: string): ((args: Record<string, any>) => Promise<string>) | undefined {
    return this.tools.get(name)?.execute;
  }

  isBuiltin(name: string): boolean {
    return this.builtins.has(name);
  }

  getBuiltin(name: string): BuiltinTool | undefined {
    return this.builtins.get(name);
  }

  getAllTools(): Tool[] {
    const custom = Array.from(this.tools.values()).map(t => t.schema);
    const builtin = Array.from(this.builtins.values());
    return [...builtin, ...custom];
  }

  getCustomTools(): ToolSchema[] {
    return Array.from(this.tools.values()).map(t => t.schema);
  }

  getBuiltinTools(): BuiltinTool[] {
    return Array.from(this.builtins.values());
  }

  hasTools(): boolean {
    return this.tools.size > 0 || this.builtins.size > 0;
  }

  clear(): void {
    this.tools.clear();
    this.builtins.clear();
  }
}

export const toolRegistry = new ToolRegistryClass();
