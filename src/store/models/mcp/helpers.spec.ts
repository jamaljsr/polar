import { Status, TapdNode } from 'shared/types';
import { Network } from 'types';
import { getNetwork } from 'utils/tests';
import { findNode, serializeStatusesForMcp } from './helpers';

describe('MCP Helpers', () => {
  describe('findNode', () => {
    let network: Network;

    beforeEach(() => {
      // Create a test network with various node types
      network = getNetwork(1, 'Test Network', Status.Started);
      // Network should have:
      // - 1 bitcoin node: backend1
      // - 2 LND nodes: alice, bob
      // - 1 c-lightning node: carol
      // - 1 eclair node: dave
    });

    describe('Bitcoin nodes', () => {
      it('should find a bitcoin node by name', () => {
        const node = findNode(network, 'backend1', 'bitcoin');
        expect(node).toBeDefined();
        expect(node.name).toBe('backend1');
        expect(node.implementation).toBe('bitcoind');
      });

      it('should find the first bitcoin node when nodeName is undefined', () => {
        const node = findNode(network, undefined, 'bitcoin');
        expect(node).toBeDefined();
        expect(node.implementation).toBe('bitcoind');
        expect(node.name).toBe('backend1'); // Should be the first one
      });

      it('should throw error if bitcoin node not found', () => {
        expect(() => findNode(network, 'nonexistent', 'bitcoin')).toThrow(
          'Bitcoin node "nonexistent" not found in network',
        );
      });

      it('should throw error if no bitcoin nodes exist', () => {
        const emptyNetwork = getNetwork(2, 'Empty Network', Status.Stopped);
        emptyNetwork.nodes.bitcoin = []; // Clear bitcoin nodes
        expect(() => findNode(emptyNetwork, undefined, 'bitcoin')).toThrow(
          'Network has no Bitcoin nodes',
        );
      });
    });

    describe('Lightning nodes', () => {
      it('should find a lightning node by name', () => {
        const node = findNode(network, 'alice', 'lightning');
        expect(node).toBeDefined();
        expect(node.name).toBe('alice');
        expect(['LND', 'c-lightning', 'eclair', 'litd']).toContain(node.implementation);
      });

      it('should throw error if lightning node not found', () => {
        expect(() => findNode(network, 'charlie', 'lightning')).toThrow(
          'Lightning node "charlie" not found in network',
        );
      });

      it('should return first lightning node when nodeName is undefined', () => {
        const firstLightningNode = findNode(network, undefined, 'lightning');
        expect(firstLightningNode).toBe(network.nodes.lightning[0]);
        expect(firstLightningNode.name).toBe('alice');
      });

      it('should throw error if network has no lightning nodes', () => {
        const emptyNetwork: Network = {
          ...network,
          nodes: {
            ...network.nodes,
            lightning: [],
          },
        };
        expect(() => findNode(emptyNetwork, undefined, 'lightning')).toThrow(
          'Network has no Lightning nodes',
        );
      });
    });

    describe('TAP nodes', () => {
      it('should find a tap node by name', () => {
        // Add a tapd node to the network
        const tapdNode: TapdNode = {
          id: 1,
          networkId: network.id,
          name: 'tap1',
          type: 'tap',
          implementation: 'tapd',
          version: '0.3.0',
          status: Status.Started,
          errorMsg: '',
          ports: { rest: 8289, grpc: 10029 },
          docker: {
            image: 'polarlightning/tapd:0.3.0',
            command: '',
          },
          lndName: 'alice',
          paths: {
            tlsCert: '/path/to/tls.cert',
            adminMacaroon: '/path/to/admin.macaroon',
          },
        };
        network.nodes.tap.push(tapdNode);

        const node = findNode(network, 'tap1', 'tap');
        expect(node).toBeDefined();
        expect(node.name).toBe('tap1');
        expect(node.implementation).toBe('tapd');
      });

      it('should throw error if tap node not found', () => {
        expect(() => findNode(network, 'nonexistent', 'tap')).toThrow(
          'Tap node "nonexistent" not found in network',
        );
      });

      it('should throw error if nodeName is required for tap nodes', () => {
        // We need to call with explicit type to test this path
        // Since TypeScript won't allow undefined with 'tap' in the overload,
        // we cast to test the runtime behavior
        expect(() => findNode(network, undefined as any, 'tap')).toThrow(
          'Node name is required for tap nodes',
        );
      });
    });

    describe('LITD nodes', () => {
      it('should throw error if nodeName is required for litd nodes', () => {
        // Since TypeScript won't allow undefined with 'litd' in the overload,
        // we cast to test the runtime behavior
        expect(() => findNode(network, undefined as any, 'litd')).toThrow(
          'Node name is required for litd nodes',
        );
      });
    });

    describe('Common nodes (no type specified)', () => {
      it('should find a bitcoin node when no type is specified', () => {
        const node = findNode(network, 'backend1');
        expect(node).toBeDefined();
        expect(node.name).toBe('backend1');
      });

      it('should find a lightning node when no type is specified', () => {
        const node = findNode(network, 'alice');
        expect(node).toBeDefined();
        expect(node.name).toBe('alice');
      });

      it('should throw error if node not found in any category', () => {
        expect(() => findNode(network, 'nonexistent')).toThrow(
          `Node "nonexistent" not found in network "${network.name}"`,
        );
      });

      it('should throw error if nodeName is undefined when no type specified', () => {
        expect(() => findNode(network)).toThrow(
          'Node name is required when type is not specified',
        );
      });
    });
  });

  describe('serializeStatusesForMcp', () => {
    it('should convert numeric status values to string labels', () => {
      const input = {
        status: Status.Started,
        nodeStatus: Status.Stopped,
        data: {
          status: Status.Error,
          nested: {
            nodeStatus: Status.Starting,
          },
        },
      };

      const result = serializeStatusesForMcp(input);

      expect(result).toEqual({
        status: 'Started',
        nodeStatus: 'Stopped',
        data: {
          status: 'Error',
          nested: {
            nodeStatus: 'Starting',
          },
        },
      });
    });

    it('should handle arrays with status values', () => {
      const input = [
        { status: Status.Started },
        { nodeStatus: Status.Stopped },
        { data: { status: Status.Error } },
      ];

      const result = serializeStatusesForMcp(input);

      expect(result).toEqual([
        { status: 'Started' },
        { nodeStatus: 'Stopped' },
        { data: { status: 'Error' } },
      ]);
    });

    it('should preserve non-status numeric values', () => {
      const input = {
        id: 123,
        port: 8080,
        status: Status.Started,
        count: 0,
      };

      const result = serializeStatusesForMcp(input);

      expect(result).toEqual({
        id: 123,
        port: 8080,
        status: 'Started',
        count: 0,
      });
    });

    it('should handle non-plain objects by returning them unchanged', () => {
      const date = new Date();
      const input = {
        status: Status.Started,
        timestamp: date,
      };

      const result = serializeStatusesForMcp(input);

      expect(result).toEqual({
        status: 'Started',
        timestamp: date,
      });
    });

    it('should handle null and undefined values', () => {
      expect(serializeStatusesForMcp(null)).toBe(null);
      expect(serializeStatusesForMcp(undefined)).toBe(undefined);
    });

    it('should handle primitive values', () => {
      expect(serializeStatusesForMcp('string')).toBe('string');
      expect(serializeStatusesForMcp(123)).toBe(123);
      expect(serializeStatusesForMcp(true)).toBe(true);
    });

    it('should handle invalid status numbers', () => {
      const input = {
        status: 999, // Invalid status number
        nodeStatus: Status.Started, // Valid status
      };

      const result = serializeStatusesForMcp(input);

      expect(result).toEqual({
        status: 999, // Should remain unchanged
        nodeStatus: 'Started',
      });
    });

    it('should handle mixed data types in arrays', () => {
      const input = ['string', 123, { status: Status.Started }, null, undefined];

      const result = serializeStatusesForMcp(input);

      expect(result).toEqual(['string', 123, { status: 'Started' }, null, undefined]);
    });

    it('should handle empty objects and arrays', () => {
      expect(serializeStatusesForMcp({})).toEqual({});
      expect(serializeStatusesForMcp([])).toEqual([]);
    });

    it('should handle deeply nested structures', () => {
      const input = {
        level1: {
          level2: {
            level3: {
              status: Status.Error,
              data: [{ nodeStatus: Status.Stopping }],
            },
          },
        },
      };

      const result = serializeStatusesForMcp(input);

      expect(result).toEqual({
        level1: {
          level2: {
            level3: {
              status: 'Error',
              data: [{ nodeStatus: 'Stopping' }],
            },
          },
        },
      });
    });
  });
});
