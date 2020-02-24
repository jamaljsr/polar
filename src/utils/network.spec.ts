import detectPort from 'detect-port';
import { LndNode, NodeImplementation, Status } from 'shared/types';
import { Network } from 'types';
import { defaultRepoState } from './constants';
import { getImageCommand, getOpenPortRange, getOpenPorts, OpenPorts } from './network';
import { getNetwork, testManagedImages } from './tests';

const mockDetectPort = detectPort as jest.Mock;

describe('Network Utils', () => {
  describe('getImageCommand', () => {
    it('should return the commands for managed images', () => {
      // create images with the commands set to their implementation
      const images = testManagedImages.map(i => ({ ...i, command: i.implementation }));
      const impls: NodeImplementation[] = ['LND', 'c-lightning', 'bitcoind'];
      impls.forEach(impl => {
        expect(getImageCommand(images, impl, defaultRepoState.images[impl].latest)).toBe(
          impl,
        );
      });
    });

    it('should thrown an error if the image was not found', () => {
      expect(() => getImageCommand(testManagedImages, 'LND', 'invalid')).toThrow();
    });
  });

  describe('getOpenPortRange', () => {
    beforeEach(() => {
      let port = 10003;
      mockDetectPort.mockImplementation(() => Promise.resolve(port++));
    });

    it('should return valid open ports', async () => {
      const ports = await getOpenPortRange([10001, 10002, 10003]);
      expect(ports).toEqual([10003, 10004, 10005]);
    });
  });

  describe('getOpenPorts', () => {
    let network: Network;

    beforeEach(() => {
      network = getNetwork();
    });

    it('should update the ports for bitcoind', async () => {
      mockDetectPort.mockImplementation(port => Promise.resolve(port + 1));
      network.nodes.lightning = [];
      const restPort = network.nodes.bitcoin[0].ports.rpc;
      const zmqBlockPort = network.nodes.bitcoin[0].ports.zmqBlock;
      const zmqTxPort = network.nodes.bitcoin[0].ports.zmqTx;
      const ports = (await getOpenPorts(network)) as OpenPorts;
      expect(ports).toBeDefined();
      expect(ports[network.nodes.bitcoin[0].name].rpc).toBe(restPort + 1);
      expect(ports[network.nodes.bitcoin[0].name].zmqBlock).toBe(zmqBlockPort + 1);
      expect(ports[network.nodes.bitcoin[0].name].zmqTx).toBe(zmqTxPort + 1);
    });

    it('should update the rest port for bitcoind', async () => {
      const portsInUse = [18443];
      mockDetectPort.mockImplementation(port =>
        Promise.resolve(portsInUse.includes(port) ? port + 1 : port),
      );
      network.nodes.lightning = [];
      const restPort = network.nodes.bitcoin[0].ports.rpc;
      const ports = (await getOpenPorts(network)) as OpenPorts;
      expect(ports).toBeDefined();
      expect(ports[network.nodes.bitcoin[0].name].rpc).toBe(restPort + 1);
      expect(ports[network.nodes.bitcoin[0].name].zmqBlock).toBeUndefined();
      expect(ports[network.nodes.bitcoin[0].name].zmqTx).toBeUndefined();
    });

    it('should update the zmq block port for bitcoind', async () => {
      const portsInUse = [28334];
      mockDetectPort.mockImplementation(port =>
        Promise.resolve(portsInUse.includes(port) ? port + 1 : port),
      );
      network.nodes.lightning = [];
      const zmqBlockPort = network.nodes.bitcoin[0].ports.zmqBlock;
      const ports = (await getOpenPorts(network)) as OpenPorts;
      expect(ports).toBeDefined();
      expect(ports[network.nodes.bitcoin[0].name].rest).toBeUndefined();
      expect(ports[network.nodes.bitcoin[0].name].zmqBlock).toBe(zmqBlockPort + 1);
      expect(ports[network.nodes.bitcoin[0].name].zmqTx).toBeUndefined();
    });

    it('should update the zmq tx port for bitcoind', async () => {
      const portsInUse = [29335];
      mockDetectPort.mockImplementation(port =>
        Promise.resolve(portsInUse.includes(port) ? port + 1 : port),
      );
      network.nodes.lightning = [];
      const zmqTxPort = network.nodes.bitcoin[0].ports.zmqTx;
      const ports = (await getOpenPorts(network)) as OpenPorts;
      expect(ports).toBeDefined();
      expect(ports[network.nodes.bitcoin[0].name].rest).toBeUndefined();
      expect(ports[network.nodes.bitcoin[0].name].zmqBlock).toBeUndefined();
      expect(ports[network.nodes.bitcoin[0].name].zmqTx).toBe(zmqTxPort + 1);
    });

    it('should update the grpc ports for lightning nodes', async () => {
      const portsInUse = [10001];
      mockDetectPort.mockImplementation(port =>
        Promise.resolve(portsInUse.includes(port) ? port + 1 : port),
      );
      network.nodes.bitcoin = [];
      const ports = (await getOpenPorts(network)) as OpenPorts;
      expect(ports).toBeDefined();
      expect(ports[network.nodes.lightning[0].name].grpc).toBe(10002);
      expect(ports[network.nodes.lightning[2].name].grpc).toBe(10003);
    });

    it('should update the rest ports for lightning nodes', async () => {
      const portsInUse = [8081];
      mockDetectPort.mockImplementation(port =>
        Promise.resolve(portsInUse.includes(port) ? port + 1 : port),
      );
      network.nodes.bitcoin = [];
      const ports = (await getOpenPorts(network)) as OpenPorts;
      expect(ports).toBeDefined();
      expect(ports[network.nodes.lightning[0].name].rest).toBe(8082);
      expect(ports[network.nodes.lightning[2].name].rest).toBe(8083);
    });

    it('should update the p2p ports for lightning nodes', async () => {
      const portsInUse = [9735, 9836, 9737];
      mockDetectPort.mockImplementation(port =>
        Promise.resolve(portsInUse.includes(port) ? port + 1 : port),
      );
      network.nodes.bitcoin = [];
      const ports = (await getOpenPorts(network)) as OpenPorts;
      expect(ports).toBeDefined();
      expect(ports[network.nodes.lightning[0].name].p2p).toBe(9736);
      expect(ports[network.nodes.lightning[1].name].p2p).toBe(9837);
      expect(ports[network.nodes.lightning[2].name].p2p).toBe(9738);
    });

    it('should not update ports if none are in use', async () => {
      const portsInUse: number[] = [];
      mockDetectPort.mockImplementation(port =>
        Promise.resolve(portsInUse.includes(port) ? port + 1 : port),
      );
      network.nodes.bitcoin = [];
      const ports = await getOpenPorts(network);
      expect(ports).toBeUndefined();
    });

    it('should not update ports for started nodes', async () => {
      mockDetectPort.mockImplementation(port => Promise.resolve(port + 1));
      network.nodes.lightning[0].status = Status.Started;
      const ports = (await getOpenPorts(network)) as OpenPorts;
      expect(ports).toBeDefined();
      // alice ports should not be changed
      expect(ports[network.nodes.lightning[0].name]).toBeUndefined();
      // bob ports should change
      const lnd2 = network.nodes.lightning[2] as LndNode;
      expect(ports[lnd2.name].grpc).toBe(lnd2.ports.grpc + 1);
      expect(ports[lnd2.name].rest).toBe(lnd2.ports.rest + 1);
    });
  });
});
