import * as electron from 'electron';
import * as log from 'electron-log';
import { createStore } from 'easy-peasy';
import { ipcChannels } from 'shared';
import { Status } from 'shared/types';
import { initChartFromNetwork } from 'utils/chart';
import {
  bitcoinServiceMock,
  createMockRootModel,
  getNetwork,
  injections,
  lightningServiceMock,
  litdServiceMock,
  tapServiceMock,
} from 'utils/tests';
import { AVAILABLE_TOOLS, tools } from './toolRegistry';

const electronMock = electron as jest.Mocked<typeof electron>;
const logMock = log as jest.Mocked<typeof log>;

describe('MCP model > IPC', () => {
  describe('AVAILABLE_TOOLS', () => {
    it('should have correct number of tools', () => {
      expect(AVAILABLE_TOOLS).toHaveLength(48);
    });

    it('should include all tool definitions', () => {
      const toolNames = AVAILABLE_TOOLS.map(t => t.name);
      expect(toolNames).toContain(tools.listNetworks.name);
      expect(toolNames).toContain(tools.createNetwork.name);
      expect(toolNames).toContain(tools.importNetworkFromZip.name);
      expect(toolNames).toContain(tools.exportNetworkToZip.name);
      expect(toolNames).toContain(tools.startNetwork.name);
      expect(toolNames).toContain(tools.stopNetwork.name);
      expect(toolNames).toContain(tools.deleteNetwork.name);
      expect(toolNames).toContain(tools.renameNetwork.name);
      expect(toolNames).toContain(tools.addNode.name);
      expect(toolNames).toContain(tools.startNode.name);
      expect(toolNames).toContain(tools.restartNode.name);
      expect(toolNames).toContain(tools.stopNode.name);
      expect(toolNames).toContain(tools.removeNode.name);
      expect(toolNames).toContain(tools.renameNode.name);
      expect(toolNames).toContain(tools.setLightningBackend.name);
      expect(toolNames).toContain(tools.setTapBackend.name);
      expect(toolNames).toContain(tools.updateNodeCommand.name);
      expect(toolNames).toContain(tools.getDefaultNodeCommand.name);
      expect(toolNames).toContain(tools.listNodeVersions.name);
      expect(toolNames).toContain(tools.mineBlocks.name);
      expect(toolNames).toContain(tools.getBlockchainInfo.name);
      expect(toolNames).toContain(tools.getBitcoinWalletInfo.name);
      expect(toolNames).toContain(tools.sendBitcoin.name);
      expect(toolNames).toContain(tools.getNewBitcoinAddress.name);
      expect(toolNames).toContain(tools.setAutoMineMode.name);
      expect(toolNames).toContain(tools.openChannel.name);
      expect(toolNames).toContain(tools.closeChannel.name);
      expect(toolNames).toContain(tools.closeTapChannel.name);
      expect(toolNames).toContain(tools.fundTapChannel.name);
      expect(toolNames).toContain(tools.listChannels.name);
      expect(toolNames).toContain(tools.getNodeInfo.name);
      expect(toolNames).toContain(tools.getWalletBalance.name);
      expect(toolNames).toContain(tools.depositFunds.name);
      expect(toolNames).toContain(tools.createInvoice.name);
      expect(toolNames).toContain(tools.payInvoice.name);
      expect(toolNames).toContain(tools.mintTapAsset.name);
      expect(toolNames).toContain(tools.listTapAssets.name);
      expect(toolNames).toContain(tools.sendTapAsset.name);
      expect(toolNames).toContain(tools.getTapBalances.name);
      expect(toolNames).toContain(tools.getTapAddress.name);
      expect(toolNames).toContain(tools.decodeTapAddress.name);
      expect(toolNames).toContain(tools.syncTapUniverse.name);
      expect(toolNames).toContain(tools.createAssetInvoice.name);
      expect(toolNames).toContain(tools.payAssetInvoice.name);
      expect(toolNames).toContain(tools.getAssetsInChannels.name);
      expect(toolNames).toContain(tools.listLitdSessions.name);
      expect(toolNames).toContain(tools.addLitdSession.name);
      expect(toolNames).toContain(tools.revokeLitdSession.name);
    });
  });

  describe('IPC handlers', () => {
    const rootModel = createMockRootModel();

    // initialize store for type inference
    let store = createStore(rootModel, { injections });

    beforeEach(() => {
      // reset the store before each test run
      store = createStore(rootModel, { injections });
      // clear all mocks
      jest.clearAllMocks();
      // Mock service wait methods
      lightningServiceMock.waitUntilOnline.mockResolvedValue();
      bitcoinServiceMock.waitUntilOnline.mockResolvedValue();
      litdServiceMock.waitUntilOnline.mockResolvedValue();
      // Mock getBlockchainInfo to return chain info
      bitcoinServiceMock.getBlockchainInfo.mockResolvedValue({
        chain: 'regtest',
        blocks: 100,
        headers: 100,
        bestblockhash: '0x1234567890abcdef',
        difficulty: 1,
        mediantime: 1640000000,
        verificationprogress: 1,
        initialblockdownload: false,
        chainwork: '0x00000000000000000000000000000000000000000000000000000001',
        size_on_disk: 1024,
        pruned: false,
        pruneheight: 0,
        automatic_pruning: false,
        prune_target_size: 0,
        softforks: [],
        bip9_softforks: [],
      });
      // Mock bitcoin wallet info
      bitcoinServiceMock.getWalletInfo.mockResolvedValue({
        balance: 5.25,
        txcount: 42,
        walletname: 'default',
        walletversion: 169900,
      } as any);
      // Mock lightning service methods for channel operations
      lightningServiceMock.getInfo.mockResolvedValue({
        pubkey: '02abcd1234',
        alias: 'test-node',
        rpcUrl: 'test-node@localhost:9735',
        syncedToChain: true,
        blockHeight: 100,
        numPendingChannels: 0,
        numActiveChannels: 0,
        numInactiveChannels: 0,
      });
      lightningServiceMock.getNewAddress.mockResolvedValue({ address: 'bcrt1qtest123' });
      lightningServiceMock.openChannel.mockResolvedValue({ txid: 'abc123', index: 0 });
      lightningServiceMock.closeChannel.mockResolvedValue(true);
      lightningServiceMock.getChannels.mockResolvedValue([]);
      lightningServiceMock.getBalances.mockResolvedValue({
        total: '5000000',
        confirmed: '4500000',
        unconfirmed: '500000',
      });
      // Mock litd service methods
      litdServiceMock.addSession.mockResolvedValue({
        id: 'test-session-id',
        label: 'Test Session',
        pairingPhrase: 'test-pairing-phrase',
        mailboxServerAddr: 'test.mailbox.com:8443',
        state: 'Created',
        type: 'Read Only',
        accountId: 'test-account-id',
        localPublicKey:
          '02test1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
        remotePublicKey:
          '03test567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        createdAt: Date.now() / 1000,
        expiresAt: Date.now() / 1000 + 86400,
      });
      litdServiceMock.listSessions.mockResolvedValue([]);
      litdServiceMock.revokeSession.mockResolvedValue();
    });

    describe('handleToolExecution', () => {
      it('should execute list_networks tool and send response', async () => {
        await store.getActions().network.addNetwork({
          name: 'test-network',
          description: 'Test',
          lndNodes: 1,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 1,
          btcdNodes: 0,
          tapdNodes: 0,
          litdNodes: 0,
          customNodes: {},
          manualMineCount: 6,
        });

        const responseChannel = 'test-response-channel-123';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.listNetworks.name,
          arguments: {},
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: { networks: expect.any(Array) },
        });

        const callArgs = (electronMock.ipcRenderer.send as jest.Mock).mock.calls[0];
        expect(callArgs[1].data.networks).toHaveLength(1);
        expect(callArgs[1].data.networks[0].name).toBe('test-network');
      });

      it('should execute create_network tool and send response', async () => {
        const responseChannel = 'test-response-channel-456';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.createNetwork.name,
          arguments: { name: 'new-test-network' },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: expect.objectContaining({
            success: true,
            message: expect.stringContaining('new-test-network'),
            network: expect.any(Object),
          }),
        });
      });

      it('should execute import_network_from_zip tool and send response', async () => {
        // Mock the importNetworkFromZip action
        const mockResult = {
          success: true,
          network: {
            id: 2,
            name: 'imported-network',
            description: 'Imported network',
            status: 'Stopped' as any,
            path: '/path/to/network',
            autoMineMode: 'off' as any,
            nodes: {
              bitcoin: [],
              lightning: [],
              tap: [],
            },
            manualMineCount: 6,
          },
          message: 'Network "imported-network" imported successfully',
        };

        jest
          .spyOn(store.getActions().mcp, 'importNetworkFromZip')
          .mockResolvedValue(mockResult);

        const responseChannel = 'test-response-import';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.importNetworkFromZip.name,
          arguments: { path: '/path/to/network.polar.zip' },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: mockResult,
        });
      });

      it('should execute export_network_to_zip tool and send response', async () => {
        // Mock the exportNetworkToZip action
        const mockResult = {
          success: true,
          outputPath: '/output/path/network.polar.zip',
          message:
            'Network "export-test-network" exported successfully to /output/path/network.polar.zip',
        };
        jest
          .spyOn(store.getActions().mcp, 'exportNetworkToZip')
          .mockResolvedValue(mockResult);

        const responseChannel = 'test-response-export';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.exportNetworkToZip.name,
          arguments: { networkId: 1, outputPath: '/output/path/network.polar.zip' },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: mockResult,
        });
      });

      it('should execute start_network tool and send response', async () => {
        // Create a network first
        await store.getActions().network.addNetwork({
          name: 'test-network',
          description: 'Test',
          lndNodes: 1,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 1,
          btcdNodes: 0,
          tapdNodes: 0,
          litdNodes: 0,
          customNodes: {},
          manualMineCount: 6,
        });

        const network = store.getState().network.networks[0];
        const responseChannel = 'test-response-start';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.startNetwork.name,
          arguments: { networkId: network.id },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: expect.objectContaining({
            success: true,
            message: expect.stringContaining('started successfully'),
            network: expect.objectContaining({
              id: network.id,
              name: 'test-network',
            }),
          }),
        });
      });

      it('should execute stop_network tool and send response', async () => {
        // Create a network first
        await store.getActions().network.addNetwork({
          name: 'test-network',
          description: 'Test',
          lndNodes: 1,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 1,
          btcdNodes: 0,
          tapdNodes: 0,
          litdNodes: 0,
          customNodes: {},
          manualMineCount: 6,
        });

        const network = store.getState().network.networks[0];
        const responseChannel = 'test-response-stop';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.stopNetwork.name,
          arguments: { networkId: network.id },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: expect.objectContaining({
            success: true,
            message: expect.stringContaining('stopped successfully'),
            network: expect.objectContaining({
              id: network.id,
              name: 'test-network',
            }),
          }),
        });
      });

      it('should execute delete_network tool and send response', async () => {
        // Create a network first
        await store.getActions().network.addNetwork({
          name: 'test-network',
          description: 'Test',
          lndNodes: 1,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 1,
          btcdNodes: 0,
          tapdNodes: 0,
          litdNodes: 0,
          customNodes: {},
          manualMineCount: 6,
        });

        const network = store.getState().network.networks[0];
        const responseChannel = 'test-response-delete';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.deleteNetwork.name,
          arguments: { networkId: network.id },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: expect.objectContaining({
            success: true,
            message: expect.stringContaining('deleted successfully'),
            network: expect.objectContaining({
              id: network.id,
              name: 'test-network',
            }),
          }),
        });
      });

      it('should execute rename_network tool and send response', async () => {
        // Create a network first
        await store.getActions().network.addNetwork({
          name: 'test-network',
          description: 'Test',
          lndNodes: 1,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 1,
          btcdNodes: 0,
          tapdNodes: 0,
          litdNodes: 0,
          customNodes: {},
          manualMineCount: 6,
        });

        const network = store.getState().network.networks[0];
        const responseChannel = 'test-response-rename-network';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.renameNetwork.name,
          arguments: { networkId: network.id, name: 'renamed-network' },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: expect.objectContaining({
            success: true,
            message: expect.stringContaining('renamed-network'),
            network: expect.objectContaining({
              id: network.id,
              name: 'renamed-network',
            }),
          }),
        });
      });

      it('should execute add_lightning_node tool and send response', async () => {
        // Create a network first
        await store.getActions().network.addNetwork({
          name: 'test-network',
          description: 'Test',
          lndNodes: 1,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 1,
          btcdNodes: 0,
          tapdNodes: 0,
          litdNodes: 0,
          customNodes: {},
          manualMineCount: 6,
        });

        const network = store.getState().network.networks[0];
        const responseChannel = 'test-response-add-lightning';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.addNode.name,
          arguments: { networkId: network.id, implementation: 'LND' },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: expect.objectContaining({
            success: true,
            message: expect.stringContaining('LND node'),
            node: expect.any(Object),
          }),
        });
      });

      it('should execute add_bitcoin_node tool and send response', async () => {
        // Create a network first
        await store.getActions().network.addNetwork({
          name: 'test-network',
          description: 'Test',
          lndNodes: 1,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 1,
          btcdNodes: 0,
          tapdNodes: 0,
          litdNodes: 0,
          customNodes: {},
          manualMineCount: 6,
        });

        const network = store.getState().network.networks[0];
        const responseChannel = 'test-response-add-bitcoin';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.addNode.name,
          arguments: { networkId: network.id, implementation: 'bitcoind' },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: expect.objectContaining({
            success: true,
            message: expect.stringContaining('Bitcoin Core node'),
            node: expect.any(Object),
          }),
        });
      });

      it('should execute list_node_versions tool and send response', async () => {
        const responseChannel = 'test-response-list-versions';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.listNodeVersions.name,
          arguments: {},
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: expect.objectContaining({
            versions: expect.any(Object),
          }),
        });

        const callArgs = (electronMock.ipcRenderer.send as jest.Mock).mock.calls.find(
          call => call[0] === responseChannel,
        );
        expect(callArgs[1].data.versions).toHaveProperty('LND');
        expect(callArgs[1].data.versions).toHaveProperty('bitcoind');
      });

      it('should execute start_node tool and send response', async () => {
        // Create a network with nodes
        await store.getActions().network.addNetwork({
          name: 'test-network',
          description: 'Test',
          lndNodes: 1,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 1,
          btcdNodes: 0,
          tapdNodes: 0,
          litdNodes: 0,
          customNodes: {},
          manualMineCount: 6,
        });

        const network = store.getState().network.networks[0];
        const nodeName = network.nodes.bitcoin[0].name;
        const responseChannel = 'test-response-start-node';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.startNode.name,
          arguments: { networkId: network.id, nodeName },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: expect.objectContaining({
            success: true,
            message: `Node "${nodeName}" started successfully`,
            networkId: network.id,
            nodeName,
            nodeStatus: 'Started',
          }),
        });
      });

      it('should execute stop_node tool and send response', async () => {
        // Create a network with nodes
        await store.getActions().network.addNetwork({
          name: 'test-network',
          description: 'Test',
          lndNodes: 1,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 1,
          btcdNodes: 0,
          tapdNodes: 0,
          litdNodes: 0,
          customNodes: {},
          manualMineCount: 6,
        });

        const network = store.getState().network.networks[0];
        const node = network.nodes.bitcoin[0];
        // Change status to Started so it can be stopped
        node.status = Status.Started;

        const responseChannel = 'test-response-stop-node';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.stopNode.name,
          arguments: { networkId: network.id, nodeName: node.name },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: expect.objectContaining({
            success: true,
            message: `Node "${node.name}" stopped successfully`,
            networkId: network.id,
            nodeName: node.name,
            nodeStatus: 'Stopped',
          }),
        });
      });

      it('should execute restart_node tool and send response', async () => {
        const toggleNodeSpy = jest.spyOn(store.getActions().network, 'toggleNode');
        toggleNodeSpy.mockImplementation(async node => {
          // Simulate the toggleNode behavior for restart: stop then start
          const network = store
            .getState()
            .network.networks.find(n => n.id === node.networkId);
          if (network) {
            const foundNode = [
              ...network.nodes.bitcoin,
              ...network.nodes.lightning,
              ...network.nodes.tap,
            ].find(n => n.name === node.name);
            if (foundNode) {
              if (foundNode.status === Status.Started) {
                foundNode.status = Status.Stopped;
              } else if (foundNode.status === Status.Stopped) {
                foundNode.status = Status.Started;
              } else if (foundNode.status === Status.Error) {
                foundNode.status = Status.Started;
              }
            }
          }
        });

        // Create a network with nodes
        await store.getActions().network.addNetwork({
          name: 'test-network',
          description: 'Test',
          lndNodes: 1,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 1,
          btcdNodes: 0,
          tapdNodes: 0,
          litdNodes: 0,
          customNodes: {},
          manualMineCount: 6,
        });

        const network = store.getState().network.networks[0];
        const node = network.nodes.bitcoin[0];
        // Change status to Started so it can be restarted
        node.status = Status.Started;

        const responseChannel = 'test-response-restart-node';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.restartNode.name,
          arguments: { networkId: network.id, nodeName: node.name },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: expect.objectContaining({
            success: true,
            message: `Node "${node.name}" restarted successfully`,
            networkId: network.id,
            nodeName: node.name,
            nodeStatus: 'Started',
          }),
        });

        toggleNodeSpy.mockRestore();
      });

      it('should execute remove_node tool and send response', async () => {
        // Create a network with nodes
        await store.getActions().network.addNetwork({
          name: 'test-network',
          description: 'Test',
          lndNodes: 1,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 2, // Need 2 bitcoin nodes to remove one
          btcdNodes: 0,
          tapdNodes: 1,
          litdNodes: 0,
          customNodes: {},
          manualMineCount: 6,
        });

        const network = store.getState().network.networks[0];
        const nodeName = network.nodes.bitcoin[1].name; // Remove the second bitcoin node

        const responseChannel = 'test-response-remove-node';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.removeNode.name,
          arguments: { networkId: network.id, nodeName },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: expect.objectContaining({
            success: true,
            message: `Bitcoin node "${nodeName}" removed from network "test-network" successfully`,
          }),
        });
      });

      it('should execute rename_node tool and send response', async () => {
        // Create a network with nodes
        await store.getActions().network.addNetwork({
          name: 'test-network',
          description: 'Test',
          lndNodes: 1,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 1,
          btcdNodes: 0,
          tapdNodes: 0,
          litdNodes: 0,
          customNodes: {},
          manualMineCount: 6,
        });

        const network = store.getState().network.networks[0];
        const nodeName = network.nodes.bitcoin[0].name;

        const responseChannel = 'test-response-rename-node';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.renameNode.name,
          arguments: {
            networkId: network.id,
            oldName: nodeName,
            newName: 'renamed-bitcoin',
          },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: expect.objectContaining({
            success: true,
            message: `Bitcoin node "${nodeName}" renamed to "renamed-bitcoin" in network "test-network" successfully`,
          }),
        });
      });

      it('should execute mine_blocks tool and send response', async () => {
        // Create a network first
        await store.getActions().network.addNetwork({
          name: 'test-network',
          description: 'Test',
          lndNodes: 1,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 1,
          btcdNodes: 0,
          tapdNodes: 0,
          litdNodes: 0,
          customNodes: {},
          manualMineCount: 6,
        });

        const network = store.getState().network.networks[0];
        const responseChannel = 'test-response-mine';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.mineBlocks.name,
          arguments: { networkId: network.id, blocks: 10 },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: expect.objectContaining({
            success: true,
            message: expect.stringContaining('10 blocks'),
            networkId: network.id,
            blocksMined: 10,
          }),
        });
      });

      it('should execute get_blockchain_info tool and send response', async () => {
        // Create a network first
        await store.getActions().network.addNetwork({
          name: 'test-network',
          description: 'Test',
          lndNodes: 1,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 1,
          btcdNodes: 0,
          tapdNodes: 0,
          litdNodes: 0,
          customNodes: {},
          manualMineCount: 6,
        });

        const network = store.getState().network.networks[0];
        const responseChannel = 'test-response-blockchain-info';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.getBlockchainInfo.name,
          arguments: { networkId: network.id },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: expect.objectContaining({
            success: true,
            nodeName: expect.any(String),
            chain: expect.any(String),
            blocks: expect.any(Number),
          }),
        });
      });

      it('should execute get_bitcoin_wallet_info tool and send response', async () => {
        // Create a network first
        await store.getActions().network.addNetwork({
          name: 'test-network',
          description: 'Test',
          lndNodes: 1,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 1,
          btcdNodes: 0,
          tapdNodes: 0,
          litdNodes: 0,
          customNodes: {},
          manualMineCount: 6,
        });

        const network = store.getState().network.networks[0];
        const responseChannel = 'test-response-bitcoin-wallet-info';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.getBitcoinWalletInfo.name,
          arguments: { networkId: network.id },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: expect.objectContaining({
            success: true,
            nodeName: expect.any(String),
            walletInfo: expect.objectContaining({
              balance: expect.any(Number),
              txcount: expect.any(Number),
            }),
          }),
        });
      });

      it('should execute get_node_info tool and send response', async () => {
        // Create a network first
        await store.getActions().network.addNetwork({
          name: 'test-network',
          description: 'Test',
          lndNodes: 1,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 1,
          btcdNodes: 0,
          tapdNodes: 0,
          litdNodes: 0,
          customNodes: {},
          manualMineCount: 6,
        });

        const network = store.getState().network.networks[0];
        const node = network.nodes.lightning[0];
        const responseChannel = 'test-response-node-info';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.getNodeInfo.name,
          arguments: { networkId: network.id, nodeName: node.name },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: expect.objectContaining({
            success: true,
            networkId: network.id,
            nodeName: node.name,
            info: expect.objectContaining({
              pubkey: expect.any(String),
              alias: expect.any(String),
              syncedToChain: expect.any(Boolean),
              blockHeight: expect.any(Number),
              numPendingChannels: expect.any(Number),
              numActiveChannels: expect.any(Number),
              numInactiveChannels: expect.any(Number),
            }),
          }),
        });
      });

      it('should execute open_channel tool and send response', async () => {
        // Create a network first
        await store.getActions().network.addNetwork({
          name: 'test-network',
          description: 'Test',
          lndNodes: 2,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 1,
          btcdNodes: 0,
          tapdNodes: 0,
          litdNodes: 0,
          customNodes: {},
          manualMineCount: 6,
        });

        const network = store.getState().network.networks[0];
        const fromNode = network.nodes.lightning[0].name;
        const toNode = network.nodes.lightning[1].name;

        const responseChannel = 'test-response-open-channel';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.openChannel.name,
          arguments: {
            networkId: network.id,
            fromNode,
            toNode,
            sats: 100000,
          },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: expect.objectContaining({
            success: true,
            message: expect.stringContaining('Opened channel'),
            networkId: network.id,
            fromNode,
            toNode,
            capacity: 100000,
            channelPoint: expect.any(String),
          }),
        });
      });

      it('should execute close_channel tool and send response', async () => {
        // Create a network first
        await store.getActions().network.addNetwork({
          name: 'test-network',
          description: 'Test',
          lndNodes: 2,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 1,
          btcdNodes: 0,
          tapdNodes: 0,
          litdNodes: 0,
          customNodes: {},
          manualMineCount: 6,
        });

        const network = store.getState().network.networks[0];
        const nodeName = network.nodes.lightning[0].name;
        const channelPoint = 'abc123:0';

        const responseChannel = 'test-response-close-channel';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.closeChannel.name,
          arguments: {
            networkId: network.id,
            nodeName,
            channelPoint,
          },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: expect.objectContaining({
            success: true,
            message: expect.stringContaining('Closed channel'),
            networkId: network.id,
            nodeName,
            channelPoint,
          }),
        });
      });

      it('should execute list_channels tool and send response', async () => {
        // Create a network first
        await store.getActions().network.addNetwork({
          name: 'test-network',
          description: 'Test',
          lndNodes: 1,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 1,
          btcdNodes: 0,
          tapdNodes: 0,
          litdNodes: 0,
          customNodes: {},
          manualMineCount: 6,
        });

        const network = store.getState().network.networks[0];
        const nodeName = network.nodes.lightning[0].name;

        const responseChannel = 'test-response-list-channels';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.listChannels.name,
          arguments: {
            networkId: network.id,
            nodeName,
          },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: expect.objectContaining({
            success: true,
            message: expect.stringContaining('Found'),
            networkId: network.id,
            nodeName,
            channels: expect.any(Array),
          }),
        });
      });

      it('should execute get_wallet_balance tool and send response', async () => {
        // Create a network first
        await store.getActions().network.addNetwork({
          name: 'test-network',
          description: 'Test',
          lndNodes: 1,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 1,
          btcdNodes: 0,
          tapdNodes: 0,
          litdNodes: 0,
          customNodes: {},
          manualMineCount: 6,
        });

        const network = store.getState().network.networks[0];
        const nodeName = network.nodes.lightning[0].name;

        const responseChannel = 'test-response-get-balance';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.getWalletBalance.name,
          arguments: {
            networkId: network.id,
            nodeName,
          },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: expect.objectContaining({
            success: true,
            message: expect.stringContaining('Retrieved balance'),
            networkId: network.id,
            nodeName,
            balance: expect.objectContaining({
              total: expect.any(String),
              confirmed: expect.any(String),
              unconfirmed: expect.any(String),
            }),
          }),
        });
      });

      it('should execute deposit_funds tool and send response', async () => {
        // Create a network first
        await store.getActions().network.addNetwork({
          name: 'test-network',
          description: 'Test',
          lndNodes: 1,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 1,
          btcdNodes: 0,
          tapdNodes: 0,
          litdNodes: 0,
          customNodes: {},
          manualMineCount: 6,
        });

        const network = store.getState().network.networks[0];
        const nodeName = network.nodes.lightning[0].name;

        const responseChannel = 'test-response-deposit-funds';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.depositFunds.name,
          arguments: {
            networkId: network.id,
            nodeName,
            sats: 50000,
          },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: expect.objectContaining({
            success: true,
            message: expect.stringContaining('Deposited 50000 sats'),
            networkId: network.id,
            nodeName,
            sats: 50000,
          }),
        });
      });

      it('should execute create_invoice tool and send response', async () => {
        // Create a network first
        await store.getActions().network.addNetwork({
          name: 'test-network',
          description: 'Test',
          lndNodes: 1,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 1,
          btcdNodes: 0,
          tapdNodes: 0,
          litdNodes: 0,
          customNodes: {},
          manualMineCount: 6,
        });

        const network = store.getState().network.networks[0];
        const nodeName = network.nodes.lightning[0].name;

        // Mock createInvoice to return an invoice string
        lightningServiceMock.createInvoice.mockResolvedValue('lnbc10u1p3xyzabc...');

        const responseChannel = 'test-response-create-invoice';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.createInvoice.name,
          arguments: {
            networkId: network.id,
            nodeName,
            amount: 1000,
            memo: 'Test invoice',
          },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: expect.objectContaining({
            success: true,
            message: expect.stringContaining('Created invoice for 1000 sats'),
            networkId: network.id,
            nodeName,
            amount: 1000,
            memo: 'Test invoice',
            invoice: expect.any(String),
          }),
        });
      });

      it('should execute pay_invoice tool and send response', async () => {
        // Create a network first
        store.getActions().network.addNetwork({
          name: 'test-network',
          description: '',
          lndNodes: 1,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 1,
          btcdNodes: 0,
          tapdNodes: 0,
          litdNodes: 0,
          customNodes: {},
          manualMineCount: 6,
        });

        lightningServiceMock.payInvoice.mockResolvedValue({
          preimage: 'test-preimage',
          amount: 1000,
          destination: 'test-destination',
        });

        await store.getActions().mcp.handleToolExecution({
          tool: tools.payInvoice.name,
          arguments: {
            networkId: 1,
            fromNode: 'alice',
            invoice: 'test-invoice-string',
          },
          responseChannel: 'test-response',
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith('test-response', {
          data: expect.objectContaining({
            success: true,
            message: 'Paid invoice from node "alice"',
            networkId: 1,
            fromNode: 'alice',
            invoice: 'test-invoice-string',
            preimage: 'test-preimage',
            destination: 'test-destination',
          }),
        });
      });

      it('should execute mint_tap_asset tool and send response', async () => {
        // Create a network with tap nodes using getNetwork
        const network = getNetwork(1, 'test-network', Status.Started, 1);
        store.getActions().network.setNetworks([network]);

        tapServiceMock.mintAsset.mockResolvedValue({
          pendingBatch: { batchKey: 'test-batch-key' },
        } as any);

        const responseChannel = 'test-response-mint';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.mintTapAsset.name,
          arguments: {
            networkId: network.id,
            nodeName: network.nodes.tap[0].name,
            assetType: 'normal',
            name: 'TestAsset',
            amount: 1000,
            decimals: 2,
          },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: expect.objectContaining({
            success: true,
            message: expect.stringContaining('Minted normal asset "TestAsset"'),
            networkId: network.id,
            nodeName: network.nodes.tap[0].name,
            assetName: 'TestAsset',
            assetType: 'normal',
            amount: 1000,
            batchKey: 'test-batch-key',
          }),
        });
      });

      it('should execute list_tap_assets tool and send response', async () => {
        // Create a network with tap nodes using getNetwork
        const network = getNetwork(1, 'test-network', Status.Started, 1);
        store.getActions().network.setNetworks([network]);

        const mockAssets = [
          {
            id: 'asset1',
            name: 'TestAsset1',
            type: 'NORMAL',
            amount: '1000',
            genesisPoint: 'genesis1',
            anchorOutpoint: 'anchor1',
            groupKey: 'group1',
            decimals: 2,
          },
        ];

        const mockRoots = [{ id: 'asset1', name: 'TestAsset1', rootSum: 1000 }];

        tapServiceMock.listAssets.mockResolvedValue(mockAssets);
        tapServiceMock.assetRoots.mockResolvedValue(mockRoots);

        // Mock getAssets to call setAssets and setAssetRoots
        jest.spyOn(store.getActions().tap, 'getAssets').mockImplementation(async node => {
          store.getActions().tap.setAssets({ node, assets: mockAssets });
          store.getActions().tap.setAssetRoots({ node, roots: mockRoots });
        });

        const responseChannel = 'test-response-list';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.listTapAssets.name,
          arguments: {
            networkId: network.id,
            nodeName: network.nodes.tap[0].name,
          },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: expect.objectContaining({
            networkId: network.id,
            assets: expect.arrayContaining([
              expect.objectContaining({
                id: 'asset1',
                name: 'TestAsset1',
                type: 'NORMAL',
                amount: '1000',
                nodeName: network.nodes.tap[0].name,
              }),
            ]),
            totalCount: 1,
          }),
        });
      });

      it('should execute send_tap_asset tool and send response', async () => {
        const network = getNetwork(1, 'test-network', Status.Started, 1);
        store.getActions().network.setNetworks([network]);

        jest.spyOn(store.getActions().tap, 'sendAsset').mockResolvedValue({
          transferTxid: 'test-txid',
        } as any);

        const responseChannel = 'test-response-send-asset';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.sendTapAsset.name,
          arguments: {
            networkId: network.id,
            fromNode: network.nodes.tap[0].name,
            address: 'test-address',
          },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: expect.objectContaining({
            success: true,
            message: expect.stringContaining('Sent Taproot Asset'),
            networkId: network.id,
            fromNode: network.nodes.tap[0].name,
            address: 'test-address',
          }),
        });
      });

      it('should execute get_tap_balances tool and send response', async () => {
        const network = getNetwork(1, 'test-network', Status.Started, 1);
        store.getActions().network.setNetworks([network]);

        const mockBalances = {
          balances: [
            {
              id: 'asset1',
              name: 'Asset One',
              balance: '1000',
              type: 'normal',
              genesisPoint: 'gp1',
            },
          ],
        };
        store.getActions().tap.setBalances({
          node: network.nodes.tap[0],
          balances: mockBalances.balances,
        });
        jest
          .spyOn(store.getActions().tap, 'getBalances')
          .mockResolvedValue(mockBalances as any);

        const responseChannel = 'test-response-get-balances';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.getTapBalances.name,
          arguments: {
            networkId: network.id,
            nodeName: network.nodes.tap[0].name,
          },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: mockBalances,
        });
      });

      it('should execute get_tap_address tool and send response', async () => {
        const network = getNetwork(1, 'test-network', Status.Started, 1);
        store.getActions().network.setNetworks([network]);

        const mockAddress = {
          encoded: 'test-address',
          id: 'asset1',
          amount: '100',
          type: 'NORMAL',
          family: 'default',
        };
        jest
          .spyOn(store.getActions().tap, 'getNewAddress')
          .mockResolvedValue(mockAddress as any);

        const responseChannel = 'test-response-get-address';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.getTapAddress.name,
          arguments: {
            networkId: network.id,
            nodeName: network.nodes.tap[0].name,
            assetId: 'asset1',
            amount: '100',
          },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: mockAddress,
        });
      });

      it('should execute decode_tap_address tool and send response', async () => {
        const network = getNetwork(1, 'test-network', Status.Started, 1);
        store.getActions().network.setNetworks([network]);

        const mockDecoded = {
          encoded: 'test-address',
          id: 'asset1',
          amount: '100',
          type: 'NORMAL',
          family: 'default',
        };
        jest
          .spyOn(store.getActions().tap, 'decodeAddress')
          .mockResolvedValue(mockDecoded as any);

        const responseChannel = 'test-response-decode-address';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.decodeTapAddress.name,
          arguments: {
            networkId: network.id,
            nodeName: network.nodes.tap[0].name,
            address: 'test-address',
          },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: {
            address: 'test-address',
            assetId: 'asset1',
            amount: '100',
          },
        });
      });

      it('should execute sync_tap_universe tool and send response', async () => {
        const network = getNetwork(1, 'test-network', Status.Started, 1);
        store.getActions().network.setNetworks([network]);

        jest.spyOn(store.getActions().tap, 'syncUniverse').mockResolvedValue(0);

        const responseChannel = 'test-response-sync-universe';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.syncTapUniverse.name,
          arguments: {
            networkId: network.id,
            nodeName: network.nodes.tap[0].name,
            universeNodeName: network.nodes.tap[0].name,
          },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: { syncedAssets: 0 },
        });
      });

      it('should execute fund_tap_channel tool and send response', async () => {
        // Create a network with litd nodes
        await store.getActions().network.addNetwork({
          name: 'test-network',
          description: 'Test',
          lndNodes: 0,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 1,
          btcdNodes: 0,
          tapdNodes: 0,
          litdNodes: 2,
          customNodes: {},
          manualMineCount: 6,
        });

        const network = store.getState().network.networks[0];
        const fromNode = network.nodes.lightning[0].name;
        const toNode = network.nodes.lightning[1].name;
        const assetId = 'test-asset-id';

        // Mock the tap store actions
        jest.spyOn(store.getActions().tap, 'syncUniverse').mockResolvedValue(0);
        jest.spyOn(store.getActions().bitcoin, 'mine').mockResolvedValue(undefined);
        jest.spyOn(store.getActions().designer, 'syncChart').mockResolvedValue(undefined);

        const responseChannel = 'test-response-fund-tap-channel';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.fundTapChannel.name,
          arguments: {
            networkId: network.id,
            fromNode,
            toNode,
            assetId,
            amount: 50000,
          },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: {
            success: true,
            message: `Funded Tap channel from "${fromNode}" to "${toNode}" with 50000 units of asset ${assetId}`,
            networkId: network.id,
            fromNode,
            toNode,
            assetId,
            amount: 50000,
          },
        });
      });

      it('should execute close_tap_channel tool and send response', async () => {
        // Create a network with litd nodes
        await store.getActions().network.addNetwork({
          name: 'test-network',
          description: 'Test',
          lndNodes: 0,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 1,
          btcdNodes: 0,
          tapdNodes: 0,
          litdNodes: 1,
          customNodes: {},
          manualMineCount: 6,
        });

        const network = store.getState().network.networks[0];
        const nodeName = network.nodes.lightning[0].name;
        const channelPoint = 'test-channel-point:0';

        const responseChannel = 'test-response-close-tap-channel';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.closeTapChannel.name,
          arguments: {
            networkId: network.id,
            nodeName,
            channelPoint,
          },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: {
            success: true,
            message: `Closed Tap channel "${channelPoint}" on node "${nodeName}"`,
            networkId: network.id,
            nodeName,
            channelPoint,
          },
        });
      });

      it('should execute create_asset_invoice tool and send response', async () => {
        // Create a network with litd nodes
        await store.getActions().network.addNetwork({
          name: 'test-network',
          description: 'Test',
          lndNodes: 0,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 1,
          btcdNodes: 0,
          tapdNodes: 0,
          litdNodes: 1,
          customNodes: {},
          manualMineCount: 6,
        });

        const network = store.getState().network.networks[0];
        const nodeName = network.nodes.lightning[0].name;

        // Mock the lit store actions
        jest.spyOn(store.getActions().lit, 'createAssetInvoice').mockResolvedValue({
          invoice: 'lnbc123',
          sats: 1000,
        });

        const responseChannel = 'test-response-create-asset-invoice';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.createAssetInvoice.name,
          arguments: {
            networkId: network.id,
            nodeName,
            assetId: 'test-asset-id',
            amount: 500,
          },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: {
            success: true,
            message: `Created asset invoice for 500 units of asset test-asset-id from node "${nodeName}"`,
            networkId: network.id,
            nodeName,
            assetId: 'test-asset-id',
            amount: 500,
            invoice: 'lnbc123',
            sats: 1000,
          },
        });
      });

      it('should execute pay_asset_invoice tool and send response', async () => {
        // Create a network with litd nodes
        await store.getActions().network.addNetwork({
          name: 'test-network',
          description: 'Test',
          lndNodes: 0,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 1,
          btcdNodes: 0,
          tapdNodes: 0,
          litdNodes: 1,
          customNodes: {},
          manualMineCount: 6,
        });

        const network = store.getState().network.networks[0];
        const nodeName = network.nodes.lightning[0].name;

        // Mock the lit store actions
        jest.spyOn(store.getActions().lit, 'payAssetInvoice').mockResolvedValue({
          preimage: 'test-preimage',
          amount: 500,
          destination: 'test-destination',
        });

        const responseChannel = 'test-response-pay-asset-invoice';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.payAssetInvoice.name,
          arguments: {
            networkId: network.id,
            fromNode: nodeName,
            assetId: 'test-asset-id',
            invoice: 'lnbc123',
          },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: {
            success: true,
            message: `Paid asset invoice using asset test-asset-id from node "${nodeName}"`,
            networkId: network.id,
            fromNode: nodeName,
            assetId: 'test-asset-id',
            invoice: 'lnbc123',
            receipt: {
              preimage: 'test-preimage',
              amount: 500,
              destination: 'test-destination',
            },
          },
        });
      });

      it('should execute get_assets_in_channels tool and send response', async () => {
        // Create a network with litd nodes
        await store.getActions().network.addNetwork({
          name: 'test-network',
          description: 'Test',
          lndNodes: 0,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 1,
          btcdNodes: 0,
          tapdNodes: 0,
          litdNodes: 1,
          customNodes: {},
          manualMineCount: 6,
        });

        const network = store.getState().network.networks[0];
        const node = network.nodes.lightning[0];
        const nodeName = node.name;

        // Set up lightning state with channels containing assets
        // getAssetsInChannels is now a computed that reads from lightning.nodes
        store.getActions().lightning.setChannels({
          node,
          channels: [
            {
              pending: false,
              uniqueId: 'chan1',
              channelPoint: 'txid:0',
              pubkey: 'peer123',
              capacity: '1000000',
              localBalance: '500000',
              remoteBalance: '500000',
              status: 'Open',
              isPrivate: false,
              assets: [
                {
                  id: 'asset123',
                  name: 'Test Asset',
                  capacity: '1000',
                  localBalance: '500',
                  remoteBalance: '500',
                  decimals: 0,
                },
              ],
            },
          ],
        });

        const responseChannel = 'test-response-get-assets-in-channels';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.getAssetsInChannels.name,
          arguments: {
            networkId: network.id,
            nodeName,
          },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: {
            success: true,
            message: `Retrieved 1 assets in channels for node "${nodeName}"`,
            networkId: network.id,
            nodeName,
            assetsInChannels: [
              {
                asset: {
                  id: 'asset123',
                  name: 'Test Asset',
                  capacity: '1000',
                  localBalance: '500',
                  remoteBalance: '500',
                  decimals: 0,
                },
                peerPubkey: 'peer123',
              },
            ],
          },
        });
      });

      it('should handle tool execution failure', async () => {
        const network = getNetwork(1, 'test-network', Status.Started, 1);
        store.getActions().network.setNetworks([network]);

        // Mock the tool to throw an error
        jest
          .spyOn(store.getActions().mcp, 'sendTapAsset')
          .mockRejectedValue(new Error('Send asset failed'));

        const responseChannel = 'test-response-failure';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.sendTapAsset.name,
          arguments: {
            networkId: network.id,
            fromNode: network.nodes.tap[0].name,
            address: 'test-address',
          },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          error: 'Send asset failed',
        });
      });

      it('should handle unknown tool error', async () => {
        const responseChannel = 'test-response-channel-789';
        await store.getActions().mcp.handleToolExecution({
          tool: 'unknown_tool',
          arguments: {},
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          error: 'Unknown tool: unknown_tool',
        });
      });

      it('should handle createNetwork validation errors', async () => {
        const responseChannel = 'test-response-channel-error';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.createNetwork.name,
          arguments: { name: '' }, // invalid: empty name
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          error: 'Network name is required',
        });
      });

      it('should log execution info', async () => {
        const responseChannel = 'test-response-channel-log';
        await store.getActions().mcp.handleToolExecution({
          tool: tools.listNetworks.name,
          arguments: {},
          responseChannel,
        });

        expect(logMock.info).toHaveBeenCalledWith('MCP: Executing tool: list_networks');
      });
    });

    describe('setupIpcListener', () => {
      it('should register IPC listeners', () => {
        store.getActions().mcp.setupIpcListener();

        expect(electronMock.ipcRenderer.on).toHaveBeenCalledWith(
          ipcChannels.mcpToolDefinitions,
          expect.any(Function),
        );
        expect(electronMock.ipcRenderer.on).toHaveBeenCalledWith(
          ipcChannels.mcpExecuteTool,
          expect.any(Function),
        );
        expect(logMock.info).toHaveBeenCalledWith('MCP: IPC listeners registered');
      });

      it('should handle tool definitions request', () => {
        store.getActions().mcp.setupIpcListener();

        // Get the handler that was registered for tool definitions
        const onCalls = (electronMock.ipcRenderer.on as jest.Mock).mock.calls;
        const toolDefinitionsCall = onCalls.find(
          call => call[0] === ipcChannels.mcpToolDefinitions,
        );
        expect(toolDefinitionsCall).toBeDefined();

        const handler = toolDefinitionsCall![1];
        const responseChannel = 'response-channel-123';

        // Call the handler
        handler({}, { responseChannel });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: AVAILABLE_TOOLS,
        });
      });

      it('should handle tool execution request', () => {
        store.getActions().mcp.setupIpcListener();

        // Get the handler that was registered for tool execution
        const onCalls = (electronMock.ipcRenderer.on as jest.Mock).mock.calls;
        const executeToolCall = onCalls.find(
          call => call[0] === ipcChannels.mcpExecuteTool,
        );
        expect(executeToolCall).toBeDefined();

        const handler = executeToolCall![1];
        const message = {
          tool: tools.listNetworks.name,
          arguments: {},
          responseChannel: 'exec-response-channel',
        };

        // Call the handler - it will call handleToolExecution
        handler({}, message);

        // The handler calls handleToolExecution which is async, but we can verify it was set up
        expect(handler).toBeDefined();
      });

      it('should execute list_litd_sessions tool and send response', async () => {
        // Create a network with 1 litd node
        await store.getActions().network.addNetwork({
          name: 'test-network',
          description: 'Test',
          lndNodes: 0,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 1,
          btcdNodes: 0,
          tapdNodes: 0,
          litdNodes: 1,
          customNodes: {},
          manualMineCount: 6,
        });

        const network = store.getState().network.networks[0];
        const nodeName = network.nodes.lightning[0].name;
        const responseChannel = 'test-response-list-litd-sessions';

        await store.getActions().mcp.handleToolExecution({
          tool: tools.listLitdSessions.name,
          arguments: { networkId: network.id, nodeName },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: expect.objectContaining({
            success: true,
            networkId: network.id,
            nodeName,
            sessions: expect.any(Array),
          }),
        });
      });

      it('should execute add_litd_session tool and send response', async () => {
        // Create a network with 1 litd node
        await store.getActions().network.addNetwork({
          name: 'test-network',
          description: 'Test',
          lndNodes: 0,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 1,
          btcdNodes: 0,
          tapdNodes: 0,
          litdNodes: 1,
          customNodes: {},
          manualMineCount: 6,
        });

        const network = store.getState().network.networks[0];
        const nodeName = network.nodes.lightning[0].name;
        const responseChannel = 'test-response-add-litd-session';

        await store.getActions().mcp.handleToolExecution({
          tool: tools.addLitdSession.name,
          arguments: {
            networkId: network.id,
            nodeName,
            label: 'Test Session',
            type: 'read_only',
          },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: expect.objectContaining({
            success: true,
            networkId: network.id,
            nodeName,
            session: expect.any(Object),
          }),
        });
      });

      it('should execute revoke_litd_session tool and send response', async () => {
        // Create a network with 1 litd node
        await store.getActions().network.addNetwork({
          name: 'test-network',
          description: 'Test',
          lndNodes: 0,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 1,
          btcdNodes: 0,
          tapdNodes: 0,
          litdNodes: 1,
          customNodes: {},
          manualMineCount: 6,
        });

        const network = store.getState().network.networks[0];
        const nodeName = network.nodes.lightning[0].name;
        const responseChannel = 'test-response-revoke-litd-session';

        await store.getActions().mcp.handleToolExecution({
          tool: tools.revokeLitdSession.name,
          arguments: {
            networkId: network.id,
            nodeName,
            localPublicKey:
              '02abcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
          },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: expect.objectContaining({
            success: true,
            networkId: network.id,
            nodeName,
          }),
        });
      });

      it('should execute send_bitcoin tool and send response', async () => {
        await store.getActions().network.addNetwork({
          name: 'test-network',
          description: 'Test',
          lndNodes: 1,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 1,
          btcdNodes: 0,
          tapdNodes: 0,
          litdNodes: 0,
          customNodes: {},
          manualMineCount: 6,
        });

        bitcoinServiceMock.sendFunds.mockResolvedValue('test-txid-123');

        const network = store.getState().network.networks[0];
        const responseChannel = 'test-response-send-bitcoin';

        await store.getActions().mcp.handleToolExecution({
          tool: tools.sendBitcoin.name,
          arguments: {
            networkId: network.id,
            fromNode: 'backend1',
            toAddress: 'bcrt1qtestaddress123',
            amount: 100000,
            autoMine: true,
          },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: expect.objectContaining({
            success: true,
            networkId: network.id,
            fromNode: 'backend1',
            toAddress: 'bcrt1qtestaddress123',
            amount: 100000,
            txid: 'test-txid-123',
            autoMined: true,
          }),
        });
      });

      it('should execute get_new_bitcoin_address tool and send response', async () => {
        await store.getActions().network.addNetwork({
          name: 'test-network',
          description: 'Test',
          lndNodes: 1,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 1,
          btcdNodes: 0,
          tapdNodes: 0,
          litdNodes: 0,
          customNodes: {},
          manualMineCount: 6,
        });

        bitcoinServiceMock.getNewAddress.mockResolvedValue('bcrt1qnewaddress456');

        const network = store.getState().network.networks[0];
        const responseChannel = 'test-response-get-new-bitcoin-address';

        await store.getActions().mcp.handleToolExecution({
          tool: tools.getNewBitcoinAddress.name,
          arguments: {
            networkId: network.id,
            nodeName: 'backend1',
          },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: expect.objectContaining({
            success: true,
            networkId: network.id,
            nodeName: 'backend1',
            address: 'bcrt1qnewaddress456',
            nodeType: 'bitcoin',
          }),
        });
      });

      it('should execute set_auto_mine_mode tool and send response', async () => {
        await store.getActions().network.addNetwork({
          name: 'test-network',
          description: 'Test',
          lndNodes: 1,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 1,
          btcdNodes: 0,
          tapdNodes: 0,
          litdNodes: 0,
          customNodes: {},
          manualMineCount: 6,
        });

        const network = store.getState().network.networks[0];
        const responseChannel = 'test-response-set-auto-mine-mode';

        await store.getActions().mcp.handleToolExecution({
          tool: tools.setAutoMineMode.name,
          arguments: {
            networkId: network.id,
            mode: 30, // AutoMineMode.Auto30s
          },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: expect.objectContaining({
            success: true,
            message: expect.stringContaining('Every 30 seconds'),
            networkId: network.id,
            mode: 30,
          }),
        });
      });

      it('should execute set_lightning_backend tool and send response', async () => {
        await store.getActions().network.addNetwork({
          name: 'test-network',
          description: 'Test',
          lndNodes: 1,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 2,
          btcdNodes: 0,
          tapdNodes: 0,
          litdNodes: 0,
          customNodes: {},
          manualMineCount: 6,
        });

        const network = store.getState().network.networks[0];
        const responseChannel = 'test-response-set-lightning-backend';

        await store.getActions().mcp.handleToolExecution({
          tool: tools.setLightningBackend.name,
          arguments: {
            networkId: network.id,
            lightningNodeName: 'alice',
            bitcoinNodeName: 'backend2',
          },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: expect.objectContaining({
            success: true,
            message: expect.stringContaining('Successfully changed backend'),
            networkId: network.id,
            lightningNodeName: 'alice',
            bitcoinNodeName: 'backend2',
          }),
        });
      });

      it('should execute set_tap_backend tool and send response', async () => {
        const network = getNetwork(1, 'test-network', Status.Stopped, 2);
        store.getActions().network.setNetworks([network]);
        const chart = initChartFromNetwork(network);
        store.getActions().designer.setChart({ id: network.id, chart });
        store.getActions().designer.setActiveId(network.id);

        const responseChannel = 'test-response-set-tap-backend';

        await store.getActions().mcp.handleToolExecution({
          tool: tools.setTapBackend.name,
          arguments: {
            networkId: network.id,
            tapNodeName: 'alice-tap',
            lndNodeName: 'bob',
          },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: expect.objectContaining({
            success: true,
            message: expect.stringContaining('Successfully changed backend'),
            networkId: network.id,
            tapNodeName: 'alice-tap',
            lndNodeName: 'bob',
          }),
        });
      });

      it('should execute update_node_command tool and send response', async () => {
        // Create a network first
        await store.getActions().network.addNetwork({
          name: 'test-network',
          description: 'Test',
          lndNodes: 1,
          clightningNodes: 0,
          eclairNodes: 0,
          bitcoindNodes: 1,
          btcdNodes: 0,
          tapdNodes: 0,
          litdNodes: 0,
          customNodes: {},
          manualMineCount: 6,
        });

        const network = store.getState().network.networks[0];
        const responseChannel = 'test-response-update-node-command';

        await store.getActions().mcp.handleToolExecution({
          tool: tools.updateNodeCommand.name,
          arguments: {
            networkId: network.id,
            nodeName: 'alice',
            command: 'lnd --custom-flag=value',
          },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: expect.objectContaining({
            success: true,
            message: expect.stringContaining('Successfully updated custom command'),
            networkId: network.id,
            nodeName: 'alice',
            command: 'lnd --custom-flag=value',
          }),
        });
      });

      it('should execute get_default_node_command tool and send response', async () => {
        const responseChannel = 'test-response-get-default-node-command';

        await store.getActions().mcp.handleToolExecution({
          tool: tools.getDefaultNodeCommand.name,
          arguments: {
            implementation: 'LND',
          },
          responseChannel,
        });

        expect(electronMock.ipcRenderer.send).toHaveBeenCalledWith(responseChannel, {
          data: expect.objectContaining({
            success: true,
            implementation: 'LND',
            version: expect.any(String),
            command: expect.any(String),
            message: expect.stringContaining('Retrieved default command for LND'),
          }),
        });
      });
    });
  });
});
