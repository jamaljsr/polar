import { ipcRenderer } from 'electron';
import { error, info } from 'electron-log';
import { thunk } from 'easy-peasy';
import { ipcChannels } from 'shared';
import { StoreInjections } from 'types';
import { RootModel } from '../';
import { serializeStatusesForMcp } from './helpers';
import { AVAILABLE_TOOLS, getToolEntry } from './toolRegistry';
import { McpExecuteMessage } from './types';

/**
 * Handles execution of MCP tools via IPC.
 * This thunk receives messages from the main process, executes the requested tool,
 * and sends the result back via IPC.
 *
 * Uses the tool registry for maintainable tool lookup and execution.
 */
export const handleToolExecution = thunk<
  Record<string, never>,
  McpExecuteMessage,
  StoreInjections,
  RootModel,
  Promise<void>
>(async (actions, message, { getStoreActions }) => {
  const { tool, arguments: args, responseChannel } = message;

  try {
    info(`MCP: Executing tool: ${tool}`);

    // Get tool entry from registry
    const toolEntry = getToolEntry(tool);

    // Execute tool using registry executor
    const mcpActions = getStoreActions().mcp;
    const result = await toolEntry.executor(mcpActions, args);

    // Serialize statuses for LLM consumption
    const formattedResult = serializeStatusesForMcp(result);

    // Send response back through IPC
    ipcRenderer.send(responseChannel, { data: formattedResult });

    info(`MCP: Tool ${tool} executed successfully`);
  } catch (err: any) {
    error(`MCP: Tool ${tool} failed:`, err.message);
    ipcRenderer.send(responseChannel, { error: err.message });
  }
});

/**
 * Sets up IPC listeners for MCP tool definitions and execution.
 * This should be called once during app initialization to register the IPC handlers.
 */
export const setupIpcListener = thunk<
  Record<string, never>,
  void,
  StoreInjections,
  RootModel,
  void
>((actions, payload, { getStoreActions }) => {
  // Remove existing listeners first to prevent accumulation
  ipcRenderer.removeAllListeners(ipcChannels.mcpToolDefinitions);
  ipcRenderer.removeAllListeners(ipcChannels.mcpExecuteTool);

  // Handle getting tool definitions
  const handleToolDefinitions = (event: any, message: { responseChannel: string }) => {
    ipcRenderer.send(message.responseChannel, { data: AVAILABLE_TOOLS });
  };

  // Handle executing tools
  const handleExecuteTool = (event: any, message: McpExecuteMessage) => {
    getStoreActions().mcp.handleToolExecution(message);
  };

  // Register IPC listeners
  ipcRenderer.on(ipcChannels.mcpToolDefinitions, handleToolDefinitions);
  ipcRenderer.on(ipcChannels.mcpExecuteTool, handleExecuteTool);

  info('MCP: IPC listeners registered');
});
