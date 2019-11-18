import detectPort from 'detect-port';
import { LndNode, Status } from 'shared/types';
import { Network } from 'types';
import { getOpenPortRange, getOpenPorts, OpenPorts } from './network';
import { getNetwork } from './tests';

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

  describe('getOpenPorts', () => {
    let network: Network;

    beforeEach(() => {
      network = getNetwork();
    });

    it('should update the port for bitcoin rpc', async () => {
      mockDetectPort.mockImplementation(port => Promise.resolve(port + 1));
      network.nodes.lightning = [];
      const port = network.nodes.bitcoin[0].ports.rpc;
      const ports = (await getOpenPorts(network)) as OpenPorts;
      expect(ports).toBeDefined();
      expect(ports[network.nodes.bitcoin[0].name].rpc).toBe(port + 1);
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
      expect(ports[network.nodes.lightning[1].name].grpc).toBe(10003);
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
      expect(ports[network.nodes.lightning[1].name].rest).toBe(8083);
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
      const lnd2 = network.nodes.lightning[1] as LndNode;
      expect(ports[lnd2.name].grpc).toBe(lnd2.ports.grpc + 1);
      expect(ports[lnd2.name].rest).toBe(lnd2.ports.rest + 1);
    });
  });
});
