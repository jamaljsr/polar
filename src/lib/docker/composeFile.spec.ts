import { getNetwork } from 'utils/tests';
import ComposeFile from './composeFile';

describe('ComposeFile', () => {
  let composeFile = new ComposeFile();
  const network = getNetwork();
  const btcNode = network.nodes.bitcoin[0];
  const lndNode = network.nodes.lightning[0];

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
    expect(composeFile.content.services['bitcoind-1']).not.toBeUndefined();
  });

  it('should create the correct bitcoind docker compose values', () => {
    composeFile.addBitcoind(btcNode);
    const service = composeFile.content.services['bitcoind-1'];
    expect(service.image).toContain('bitcoind');
    expect(service.container_name).toEqual('polar-n1-bitcoind-1');
    expect(service.volumes[0]).toContain('/bitcoind-1:');
  });

  it('should add an lnd config', () => {
    composeFile.addLnd(lndNode, btcNode);
    expect(composeFile.content.services['lnd-1']).not.toBeUndefined();
  });

  it('should create the correct lnd docker compose values', () => {
    composeFile.addLnd(lndNode, btcNode);
    const service = composeFile.content.services['lnd-1'];
    expect(service.image).toContain('lnd');
    expect(service.container_name).toEqual('polar-n1-lnd-1');
    expect(service.command).toContain('bitcoind-1');
    expect(service.volumes[0]).toContain('/lnd-1:');
  });
});
