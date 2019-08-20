import { bitcoind, lnd } from './nodeTemplates';

describe('nodeTemplates', () => {
  it('should create a valid bitcoind config', () => {
    const node = bitcoind('mynode');
    expect(node.image).toContain('bitcoind');
    expect(node.container_name).toEqual('mynode');
    expect(node.volumes[0]).toContain('mynode');
  });

  it('should create a valid lnd config', () => {
    const node = lnd('mynode', 'btcnode1');
    expect(node.image).toContain('lnd');
    expect(node.container_name).toEqual('mynode');
    expect(node.command).toContain('btcnode1');
    expect(node.volumes[0]).toContain('mynode');
  });
});
