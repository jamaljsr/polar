import detectPort from 'detect-port';
import { Network } from 'types';
import { ensureOpenPorts, getOpenPortRange } from './network';
import { getNetwork } from './tests';
import { Status } from 'shared/types';

const mockDetectPort = detectPort as jest.Mock;

describe('Network Utils', () => {
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

  describe('ensureOpenPorts', () => {
    let network: Network;

    const getAllPorts = () => {
      return [
        ...network.nodes.bitcoin.map(n => n.ports.rpc),
        ...network.nodes.lightning.map(n => n.ports.grpc),
        ...network.nodes.lightning.map(n => n.ports.rest),
      ];
    };

    beforeEach(() => {
      network = getNetwork();
    });

    it('should update the port for bitcoin rpc', async () => {
      mockDetectPort.mockImplementation(port => Promise.resolve(port + 1));
      network.nodes.lightning = [];
      const port = network.nodes.bitcoin[0].ports.rpc;
      const updated = await ensureOpenPorts(network);
      expect(updated).toBe(true);
      expect(network.nodes.bitcoin[0].ports.rpc).toBe(port + 1);
    });

    it('should update the ports for lightning nodes', async () => {
      const portsInUse = [10001];
      mockDetectPort.mockImplementation(port =>
        Promise.resolve(portsInUse.includes(port) ? port + 1 : port),
      );
      network.nodes.bitcoin = [];
      const ports = getAllPorts();
      const updated = await ensureOpenPorts(network);
      const newPorts = getAllPorts();
      expect(updated).toBe(true);
      expect(newPorts[0]).toEqual(ports[0] + 1);
      expect(newPorts[1]).toEqual(ports[1] + 1);
      expect(newPorts[2]).toEqual(ports[2]);
      expect(newPorts[3]).toEqual(ports[3]);
    });

    it('should not update ports if none are in use', async () => {
      const portsInUse: number[] = [];
      mockDetectPort.mockImplementation(port =>
        Promise.resolve(portsInUse.includes(port) ? port + 1 : port),
      );
      network.nodes.bitcoin = [];
      const ports = getAllPorts();
      const updated = await ensureOpenPorts(network);
      const newPorts = getAllPorts();
      expect(updated).toBe(false);
      expect(newPorts[0]).toEqual(ports[0]);
      expect(newPorts[1]).toEqual(ports[1]);
      expect(newPorts[2]).toEqual(ports[2]);
      expect(newPorts[3]).toEqual(ports[3]);
    });

    it('should not update ports for started nodes', async () => {
      mockDetectPort.mockImplementation(port => Promise.resolve(port + 1));
      const ports = getAllPorts();
      network.nodes.lightning[0].status = Status.Started;
      const updated = await ensureOpenPorts(network);
      const newPorts = getAllPorts();
      expect(updated).toBe(true);
      // indexes 1 & 3 are the grpc & rest ports for the first lightning node
      expect(newPorts[1]).toEqual(ports[1]);
      expect(newPorts[3]).toEqual(ports[3]);
    });
  });
});
