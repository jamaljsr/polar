import { bitcoind, lnd } from './nodeTemplates';

describe('nodeTemplates', () => {
  it('should create a valid bitcoind config', () => {
    const node = bitcoind('mynode', '0.18.1', 18443);
    expect(node.image).toContain('bitcoind');
    expect(node.container_name).toEqual('mynode');
    expect(node.volumes[0]).toContain('mynode');
  });

  it('should create a valid lnd config', () => {
    const node = lnd('mynode', '0.7.1-beta', 'btcnode1', 8080, 10009);
    expect(node.image).toContain('lnd');
    expect(node.container_name).toEqual('mynode');
    expect(node.command).toContain('btcnode1');
    expect(node.volumes[0]).toContain('mynode');
  });
});
