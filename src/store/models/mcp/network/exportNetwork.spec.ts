import { createStore } from 'easy-peasy';
import { Status } from 'shared/types';
import { zipNetwork } from 'utils/network';
import { createMockRootModel, injections } from 'utils/tests';

// Mock the utils/network module
jest.mock('utils/network', () => ({
  zipNetwork: jest.fn(),
}));

const mockZipNetwork = zipNetwork as jest.Mocked<typeof zipNetwork>;

describe('MCP model > exportNetworkToZip', () => {
  const rootModel = createMockRootModel();

  // initialize store for type inference
  let store = createStore(rootModel, { injections });

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections });
    jest.clearAllMocks();
    (mockZipNetwork as jest.Mock).mockResolvedValue(undefined);

    // Setup default network in store
    store.getState().network.networks = [
      {
        id: 1,
        name: 'test-network',
        description: 'A test network',
        status: Status.Stopped,
        path: '/path/to/network',
        autoMineMode: 'off' as any,
        nodes: {
          bitcoin: [],
          lightning: [],
          tap: [],
        },
        manualMineCount: 6,
      },
      {
        id: 2,
        name: 'running-network',
        description: 'A running network',
        status: Status.Started,
        path: '/path/to/running',
        autoMineMode: 'off' as any,
        nodes: {
          bitcoin: [],
          lightning: [],
          tap: [],
        },
        manualMineCount: 6,
      },
    ];
  });

  it('should export a stopped network to zip', async () => {
    const mockActiveChart = {
      offset: { x: 0, y: 0 },
      nodes: {},
      links: {},
      scale: 1,
      selected: {},
      hovered: {},
    };
    store.getActions().designer.setChart({ id: 1, chart: mockActiveChart });
    store.getActions().designer.setActiveId(1);

    const result = await store.getActions().mcp.exportNetworkToZip({
      networkId: 1,
      outputPath: '/output/path/network.polar.zip',
    });

    expect(mockZipNetwork).toHaveBeenCalledWith(
      store.getState().network.networks[0],
      mockActiveChart,
      '/output/path/network.polar.zip',
    );
    expect(result.success).toBe(true);
    expect(result.outputPath).toBe('/output/path/network.polar.zip');
    expect(result.message).toContain('test-network');
    expect(result.message).toContain('exported successfully');
  });

  it('should export an error network to zip', async () => {
    // Change network status to Error
    store.getState().network.networks[0].status = Status.Error;

    const result = await store.getActions().mcp.exportNetworkToZip({
      networkId: 1,
      outputPath: '/output/path/network.polar.zip',
    });

    expect(result.success).toBe(true);
  });

  it('should throw error when networkId is missing', async () => {
    await expect(
      store.getActions().mcp.exportNetworkToZip({
        networkId: undefined as any,
        outputPath: '/output/path/network.polar.zip',
      }),
    ).rejects.toThrow('Network ID is required');
  });

  it('should throw error when networkId is not provided', async () => {
    await expect(
      store.getActions().mcp.exportNetworkToZip({
        outputPath: '/output/path/network.polar.zip',
      } as any),
    ).rejects.toThrow('Network ID is required');
  });

  it('should throw error when outputPath is missing', async () => {
    await expect(
      store.getActions().mcp.exportNetworkToZip({
        networkId: 1,
        outputPath: '',
      }),
    ).rejects.toThrow('Output path is required');
  });

  it('should throw error when outputPath is not provided', async () => {
    await expect(
      store.getActions().mcp.exportNetworkToZip({
        networkId: 1,
      } as any),
    ).rejects.toThrow('Output path is required');
  });

  it('should throw error when network does not exist', async () => {
    await expect(
      store.getActions().mcp.exportNetworkToZip({
        networkId: 999,
        outputPath: '/output/path/network.polar.zip',
      }),
    ).rejects.toThrow(`Network with the id '999' was not found.`);
  });

  it('should throw error when network is started', async () => {
    await expect(
      store.getActions().mcp.exportNetworkToZip({
        networkId: 2, // running-network
        outputPath: '/output/path/network.polar.zip',
      }),
    ).rejects.toThrow('Network "running-network" cannot be exported');
    expect(mockZipNetwork).not.toHaveBeenCalled();
  });

  it('should throw error when zipNetwork fails', async () => {
    (mockZipNetwork as jest.Mock).mockRejectedValue(new Error('Zip failed'));

    await expect(
      store.getActions().mcp.exportNetworkToZip({
        networkId: 1,
        outputPath: '/output/path/network.polar.zip',
      }),
    ).rejects.toThrow('Zip failed');
  });
});
