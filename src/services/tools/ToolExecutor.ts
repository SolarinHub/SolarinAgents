import { toolRegistry, type ToolCall, type ToolResult } from './ToolRegistry';

const MAX_ITERATIONS = 5;

class ToolExecutorClass {
  async execute(toolCall: ToolCall): Promise<ToolResult> {
    const name = toolCall.function.name;
    const executor = toolRegistry.getExecutor(name);

    if (!executor) {
      return {
        toolCallId: toolCall.id,
        content: `Tool "${name}" not found`,
      };
    }

    try {
      let args: Record<string, any> = {};
      if (toolCall.function.arguments) {
        args = JSON.parse(toolCall.function.arguments);
      }
      const result = await executor(args);
      return { toolCallId: toolCall.id, content: result };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'unknown_error';
      return { toolCallId: toolCall.id, content: `Error: ${msg}` };
    }
  }

  async executeAll(toolCalls: ToolCall[]): Promise<ToolResult[]> {
    const results: ToolResult[] = [];
    for (const call of toolCalls) {
      if (toolRegistry.isBuiltin(call.function.name)) {
        continue;
      }
      const result = await this.execute(call);
      results.push(result);
    }
    return results;
  }

  hasReachedLimit(iteration: number): boolean {
    return iteration >= MAX_ITERATIONS;
  }

  getMaxIterations(): number {
    return MAX_ITERATIONS;
  }
}

export const toolExecutor = new ToolExecutorClass();
