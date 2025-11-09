import { existsSync } from 'fs';
import { createStore } from 'easy-peasy';
import { createMockRootModel, injections } from 'utils/tests';

jest.mock('fs');

const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;

describe('MCP model > importNetworkFromZip', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
    jest.clearAllMocks();
    mockExistsSync.mockReturnValue(true);
  });

  it('should import a network from a valid zip file', async () => {
    const mockNetwork = {
      id: 1,
      name: 'imported-network',
      description: 'A test network',
      status: 'Stopped' as any,
      path: '/path/to/network',
      autoMineMode: 'off' as any,
      nodes: {
        bitcoin: [],
        lightning: [],
        tap: [],
      },
    };

    // Mock the importNetwork action
    const mockImportNetwork = jest.fn().mockResolvedValue(mockNetwork);
    (store.getActions().network as any).importNetwork = mockImportNetwork;

    const result = await store.getActions().mcp.importNetworkFromZip({
      path: '/path/to/network.polar.zip',
    });

    expect(mockExistsSync).toHaveBeenCalledWith('/path/to/network.polar.zip');
    expect(mockImportNetwork).toHaveBeenCalledWith('/path/to/network.polar.zip');
    expect(result.success).toBe(true);
    expect(result.network).toBe(mockNetwork);
    expect(result.message).toContain('imported-network');
    expect(result.message).toContain('imported successfully');
  });

  it('should throw error when path is missing', async () => {
    await expect(
      store.getActions().mcp.importNetworkFromZip({
        path: '',
      }),
    ).rejects.toThrow('Path to zip file is required');
  });

  it('should throw error when path is not provided', async () => {
    await expect(store.getActions().mcp.importNetworkFromZip({} as any)).rejects.toThrow(
      'Path to zip file is required',
    );
  });

  it('should throw error when zip file does not exist', async () => {
    (mockExistsSync as jest.Mock).mockReturnValue(false);

    await expect(
      store.getActions().mcp.importNetworkFromZip({
        path: '/nonexistent/file.zip',
      }),
    ).rejects.toThrow('Zip file does not exist at path: /nonexistent/file.zip');

    expect(mockExistsSync).toHaveBeenCalledWith('/nonexistent/file.zip');
  });

  it('should throw error when importNetwork fails', async () => {
    const mockImportNetwork = jest.fn().mockRejectedValue(new Error('Import failed'));
    (store.getActions().network as any).importNetwork = mockImportNetwork;

    await expect(
      store.getActions().mcp.importNetworkFromZip({
        path: '/path/to/network.polar.zip',
      }),
    ).rejects.toThrow('Import failed');
  });
});
