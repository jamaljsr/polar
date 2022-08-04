import { CLightningNode, LndNode } from 'shared/types';
import { bitcoinCredentials } from 'utils/constants';
import { getNetwork } from 'utils/tests';
import ComposeFile from './composeFile';

describe('ComposeFile', () => {
  let composeFile = new ComposeFile();
  const network = getNetwork();
  const btcNode = network.nodes.bitcoin[0];
  const lndNode = network.nodes.lightning[0] as LndNode;
  const clnNode = network.nodes.lightning[1] as CLightningNode;

  beforeEach(() => {
    composeFile = new ComposeFile();
  });

  it('should have no services initially', () => {
    expect(composeFile.content.services).toEqual({});
  });

  it('should have a valid docker version', () => {
    expect(composeFile.content.version).toEqual('3.3');
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
});
