/**
 * MCP Tool definition matching MCP specification
 */
export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface McpExecuteMessage {
  tool: string;
  arguments: any;
  responseChannel: string;
}

/**
 * Shared arguments for the network ID for multiple network tools
 */
export interface NetworkIdArgs {
  networkId: number;
}
