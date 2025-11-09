import { BrowserWindow, ipcMain } from 'electron';
import { debug } from 'electron-log';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { ipcChannels } from '../src/shared';
import { MCP_PORT } from './constants';

/**
 * MCP Tool definition interface (matches the one in store)
 */
interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

/**
 * Parse JSON body from request with size limit protection
 */
function parseBody(req: IncomingMessage, maxSize = 1024 * 1024): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;

    req.on('data', chunk => {
      size += chunk.length;
      if (size > maxSize) {
        req.removeAllListeners();
        reject(new Error('Request body too large'));
        return;
      }
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

/**
 * Send JSON response
 */
function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

/**
 * Get tool definitions from the store
 */
async function getToolDefinitions(mainWindow: BrowserWindow): Promise<McpTool[]> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Failed to get tool definitions - timeout'));
    }, 5000); // 5 second timeout

    const responseChannel = `${ipcChannels.mcpToolDefinitions}-${Date.now()}`;

    ipcMain.once(responseChannel, (_event: any, result: any) => {
      clearTimeout(timeout);
      if (result.error) {
        reject(new Error(result.error));
      } else {
        resolve(result.data);
      }
    });

    mainWindow.webContents.send(ipcChannels.mcpToolDefinitions, {
      responseChannel,
    });
  });
}

/**
 * Execute a tool by communicating with the renderer process
 */
async function executeTool(
  mainWindow: BrowserWindow,
  toolName: string,
  args: any,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Tool execution timed out'));
    }, 30000); // 30 second timeout

    // Send IPC message to renderer and wait for response
    const responseChannel = `${ipcChannels.mcpExecuteTool}-${toolName}-${Date.now()}`;

    ipcMain.once(responseChannel, (_event: any, result: any) => {
      clearTimeout(timeout);
      if (result.error) {
        reject(new Error(result.error));
      } else {
        resolve(result.data);
      }
    });

    mainWindow.webContents.send(ipcChannels.mcpExecuteTool, {
      tool: toolName,
      arguments: args,
      responseChannel,
    });
  });
}

/**
 * HTTP request handler
 */
async function handleRequest(
  mainWindow: BrowserWindow,
  req: IncomingMessage,
  res: ServerResponse,
) {
  const url = new URL(req.url || '', `http://localhost:${MCP_PORT}`);

  // CORS headers - restrict to localhost only for security
  const origin = req.headers.origin;
  if (origin && /^http:\/\/localhost(:\d+)?$/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    // GET /health - Health check endpoint
    if (req.method === 'GET' && url.pathname === '/health') {
      sendJson(res, 200, { status: 'ok', service: 'polar-mcp-bridge' });
      return;
    }

    // GET /api/mcp/tools - Return available tools
    if (req.method === 'GET' && url.pathname === '/api/mcp/tools') {
      debug('MCP Bridge: Getting tools from store');
      try {
        const tools = await getToolDefinitions(mainWindow);
        debug(
          `MCP Bridge: ${tools.length} Tools available:`,
          tools.map(tool => tool.name).join(', '),
        );
        sendJson(res, 200, { tools });
      } catch (err: any) {
        debug('MCP Bridge: Failed to get tools:', err);
        sendJson(res, 500, { error: err.message });
      }
      return;
    }

    // POST /api/mcp/execute - Execute a tool
    if (req.method === 'POST' && url.pathname === '/api/mcp/execute') {
      const body = await parseBody(req);
      const { tool, arguments: args } = body;

      if (!tool) {
        sendJson(res, 400, { error: 'Missing tool name' });
        return;
      }

      debug(`MCP Bridge: Executing tool ${tool} with args:`, args);

      try {
        const result = await executeTool(mainWindow, tool, args);
        sendJson(res, 200, result);
      } catch (err: any) {
        debug(`MCP Bridge: Tool execution failed:`, err);
        sendJson(res, 500, { error: err.message });
      }
      return;
    }

    // 404 for unknown routes
    sendJson(res, 404, { error: 'Not found' });
  } catch (err: any) {
    debug('MCP Bridge: Request handling error:', err);
    sendJson(res, 500, { error: err.message });
  }
}

/**
 * Start the MCP HTTP bridge server
 */
export function startMcpBridge(mainWindow: BrowserWindow): void {
  const server = createServer((req, res) => {
    handleRequest(mainWindow, req, res).catch(err => {
      debug('MCP Bridge: Unhandled error:', err);
      sendJson(res, 500, { error: 'Internal server error' });
    });
  });

  server.listen(MCP_PORT, 'localhost', () => {
    debug(`MCP Bridge: HTTP server listening on http://localhost:${MCP_PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      debug(`MCP Bridge: Port ${MCP_PORT} already in use`);
    } else {
      debug('MCP Bridge: Server error:', err);
    }
  });
}
