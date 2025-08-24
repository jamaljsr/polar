import { CLightningNode, LitdNode, LndNode, TapdNode, EclairNode } from 'shared/types';
import { bitcoinCredentials, defaultRepoState } from 'utils/constants';
import { createNetwork } from 'utils/network';
import { testManagedImages } from 'utils/tests';
import ComposeFile from './composeFile';

describe('ComposeFile', () => {
  let composeFile = new ComposeFile(1);
  const network = createNetwork({
    id: 1,
    name: 'test network',
    description: 'network description',
    lndNodes: 1,
    clightningNodes: 1,
    eclairNodes: 1,
    bitcoindNodes: 1,
    tapdNodes: 1,
    litdNodes: 1,
    repoState: defaultRepoState,
    managedImages: testManagedImages,
    customImages: [],
    monitoringEnabled: false,
  });
  const btcNode = network.nodes.bitcoin[0];
  const lndNode = network.nodes.lightning[0] as LndNode;
  const clnNode = network.nodes.lightning[1] as CLightningNode;
  const litdNode = network.nodes.lightning[3] as LitdNode;
  const tapNode = network.nodes.tap[0] as TapdNode;

  beforeEach(() => {
    composeFile = new ComposeFile(1);
  });

  it('should have no services initially', () => {
    expect(composeFile.content.services).toEqual({});
  });

  it('should have a name', () => {
    expect(composeFile.content.name).toEqual('polar-network-1');
  });

  it('should add multiple services', () => {
    composeFile.addBitcoind(btcNode);
    composeFile.addLnd(lndNode, btcNode);
    expect(Object.keys(composeFile.content.services).length).toEqual(2);
  });

  it('should add a bitcoind config', () => {
    composeFile.addBitcoind(btcNode);
    expect(composeFile.content.services['backend1']).not.toBeUndefined();
  });

  it('should create the correct bitcoind docker compose values', () => {
    composeFile.addBitcoind(btcNode);
    const service = composeFile.content.services['backend1'];
    expect(service.image).toContain('bitcoind');
    expect(service.container_name).toEqual('polar-n1-backend1');
    expect(service.command).toContain(bitcoinCredentials.user);
    expect(service.volumes[0]).toContain('/backend1:');
  });

  it('should use the bitcoind nodes docker data', () => {
    btcNode.docker = { image: 'my-image', command: 'my-command' };
    composeFile.addBitcoind(btcNode);
    const service = composeFile.content.services['backend1'];
    expect(service.image).toBe('my-image');
    expect(service.command).toBe('my-command');
  });

  it('should add an lnd config', () => {
    composeFile.addLnd(lndNode, btcNode);
    expect(composeFile.content.services['alice']).not.toBeUndefined();
  });

  it('should create the correct lnd docker compose values', () => {
    composeFile.addLnd(lndNode, btcNode);
    const service = composeFile.content.services['alice'];
    expect(service.image).toContain('lnd');
    expect(service.container_name).toEqual('polar-n1-alice');
    expect(service.command).toContain('backend');
    expect(service.volumes[0]).toContain('/alice:');
  });

  it('should use the lnd nodes docker data', () => {
    lndNode.docker = { image: 'my-image', command: 'my-command' };
    composeFile.addLnd(lndNode, btcNode);
    const service = composeFile.content.services['alice'];
    expect(service.image).toBe('my-image');
    expect(service.command).toBe('my-command');
  });

  it('should add an c-lightning config', () => {
    composeFile.addClightning(clnNode, btcNode);
    expect(composeFile.content.services['bob']).not.toBeUndefined();
  });

  it('should create the correct c-lightning docker compose values', () => {
    composeFile.addClightning(clnNode, btcNode);
    const service = composeFile.content.services['bob'];
    expect(service.image).toContain('clightning');
    expect(service.container_name).toEqual('polar-n1-bob');
    expect(service.command).toContain('backend');
    expect(service.volumes[0]).toContain('/bob/lightningd:');
  });

  it('should have the grpc port for c-lightning', () => {
    composeFile.addClightning(clnNode, btcNode);
    const service = composeFile.content.services['bob'];
    expect(service.command).toContain('--grpc-port');
  });

  it('should not have the grpc port for c-lightning', () => {
    clnNode.version = '0.10.1';
    clnNode.ports.grpc = 0;
    composeFile.addClightning(clnNode, btcNode);
    const service = composeFile.content.services['bob'];
    expect(service.command).not.toContain('--grpc-port');
  });

  it('should use the c-lightning nodes docker data', () => {
    clnNode.docker = { image: 'my-image', command: 'my-command' };
    composeFile.addClightning(clnNode, btcNode);
    const service = composeFile.content.services['bob'];
    expect(service.image).toBe('my-image');
    expect(service.command).toBe('my-command');
  });

  it('should add an tap config', () => {
    composeFile.addTapd(tapNode, lndNode);
    expect(composeFile.content.services['alice-tap']).not.toBeUndefined();
  });

  it('should create the correct tapd docker compose values', () => {
    composeFile.addTapd(tapNode, lndNode);
    const service = composeFile.content.services['alice-tap'];
    expect(service.image).toContain('tapd');
    expect(service.container_name).toEqual('polar-n1-alice-tap');
    expect(service.command).toContain('lnd.host=polar-n1-alice');
    expect(service.volumes[0]).toContain('/alice:');
    expect(service.volumes[1]).toContain('/alice-tap:');
  });

  it('should use the tapd nodes custom docker data', () => {
    const tap = {
      ...tapNode,
      docker: { image: 'my-image', command: 'my-command' },
    };
    composeFile.addTapd(tap, lndNode);
    const service = composeFile.content.services['alice-tap'];
    expect(service.image).toBe('my-image');
    expect(service.command).toBe('my-command');
  });

  it('should use the correct command for tapd v3', () => {
    const tap = { ...tapNode, version: '0.3.3' };
    composeFile.addTapd(tap, lndNode);
    const service = composeFile.content.services['alice-tap'];
    expect(service.command).toContain('--universe.public-access');
    expect(service.command).not.toContain('--universe.public-access=rw');
    expect(service.command).not.toContain('--universe.sync-all-assets');
  });

  it('should use the correct command for tapd v4+', () => {
    const tap = { ...tapNode, version: '0.4.0' };
    composeFile.addTapd(tap, lndNode);
    const service = composeFile.content.services['alice-tap'];
    expect(service.command).toContain('--universe.public-access=rw');
    expect(service.command).toContain('--universe.sync-all-assets');
  });

  it('should add an litd config', () => {
    composeFile.addLitd(litdNode, btcNode, litdNode);
    expect(composeFile.content.services['dave']).not.toBeUndefined();
  });

  it('should create the correct litd docker compose values', () => {
    composeFile.addLitd(litdNode, btcNode, litdNode);
    const service = composeFile.content.services['dave'];
    expect(service.image).toContain('litd');
    expect(service.container_name).toEqual('polar-n1-dave');
    expect(service.command).toContain('lnd.bitcoind.rpchost=polar-n1-backend1');
    expect(service.volumes[0]).toContain('/dave/lit:');
    expect(service.volumes[1]).toContain('/dave/lnd:');
    expect(service.volumes[2]).toContain('/dave/tapd:');
  });

  it('should use the tapd nodes custom docker data', () => {
    litdNode.docker = { image: 'my-image', command: 'my-command' };
    composeFile.addLitd(litdNode, btcNode, litdNode);
    const service = composeFile.content.services['dave'];
    expect(service.image).toBe('my-image');
    expect(service.command).toBe('my-command');
  });

  it('should not add controller or monitor if monitoringEnabled is false', () => {
    composeFile = new ComposeFile(1, false);
    composeFile.addController(1);
    composeFile.addMonitor('container', 'host');
    expect(Object.keys(composeFile.content.services)).toEqual([]);
  });

  it('should add controller and monitor if monitoringEnabled is true', () => {
    composeFile = new ComposeFile(1, true);
    composeFile.addController(1);
    composeFile.addMonitor('container', 'host');
    const keys = Object.keys(composeFile.content.services);
    expect(keys).toContain('control');
    expect(keys).toContain('container-monitor');
  });

  it('should use hostname as key for legacy nodes and container_name for monitor nodes', () => {
    // ComposeService (legacy node)
    const legacyService = {
      image: 'img',
      container_name: 'container1',
      hostname: 'host1',
      command: 'cmd',
      volumes: [],
      expose: [],
      ports: [],
    };
    composeFile.addService(legacyService);
    expect(composeFile.content.services['host1']).toBeDefined();

    // MonitorComposeService (monitor node, no hostname)
    const monitorService = {
      image: 'img',
      container_name: 'monitor1',
      command: 'cmd',
      volumes: [],
      expose: [],
    };
    composeFile.addService(monitorService);
    expect(composeFile.content.services['monitor1']).toBeDefined();
  });

  it('should always set environment and stop_grace_period in addService', () => {
    const service = {
      image: 'img',
      container_name: 'container2',
      command: 'cmd',
      volumes: [],
      expose: [],
    };
    composeFile.addService(service);
    const result = composeFile.content.services['container2'];
    expect(result.environment).toEqual({
      USERID: '${USERID:-1000}',
      GROUPID: '${GROUPID:-1000}',
    });
    expect(result.stop_grace_period).toBe('30s');
  });

  it('should add both LND and its monitor service when monitoringEnabled is true', () => {
    composeFile = new ComposeFile(1, true);
    composeFile.addLnd(lndNode, btcNode);
    const keys = Object.keys(composeFile.content.services);
    expect(keys).toContain('alice'); // LND node
    expect(keys.some(k => k.includes('monitor'))).toBe(true);
  });

  it('should add both c-lightning and its monitor service when monitoringEnabled is true', () => {
    composeFile = new ComposeFile(1, true);
    composeFile.addClightning(clnNode, btcNode);
    const keys = Object.keys(composeFile.content.services);
    expect(keys).toContain('bob'); // c-lightning node
    expect(keys.some(k => k.includes('monitor'))).toBe(true);
  });

  it('should add both Eclair and its monitor service when monitoringEnabled is true', () => {
    composeFile = new ComposeFile(1, true);
    const eclairNode = network.nodes.lightning[2] as EclairNode;
    composeFile.addEclair(eclairNode, btcNode);
    const keys = Object.keys(composeFile.content.services);
    expect(keys).toContain('carol'); // Eclair node
    expect(keys.some(k => k.includes('monitor'))).toBe(true);
  });

  it('should add both Litd and its monitor service when monitoringEnabled is true', () => {
    composeFile = new ComposeFile(1, true);
    composeFile.addLitd(litdNode, btcNode, litdNode);
    const keys = Object.keys(composeFile.content.services);
    expect(keys).toContain('dave'); // Litd node
    expect(keys.some(k => k.includes('monitor'))).toBe(true);
  });

  it('should add both Tapd and its monitor service when monitoringEnabled is true', () => {
    composeFile = new ComposeFile(1, true);
    composeFile.addTapd(tapNode, lndNode);
    const keys = Object.keys(composeFile.content.services);
    expect(keys).toContain('alice-tap'); // Tapd node
    expect(keys.some(k => k.includes('monitor'))).toBe(true);
  });
});
