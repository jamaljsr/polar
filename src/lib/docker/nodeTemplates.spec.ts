import { LndVersion } from 'shared/types';
import { bitcoind, lnd } from './nodeTemplates';

describe('nodeTemplates', () => {
  it('should create a valid bitcoind config', () => {
    const node = bitcoind('mynode', 'polar-mynode', '0.18.1', 18443);
    expect(node.image).toContain('bitcoind');
    expect(node.container_name).toEqual('polar-mynode');
    expect(node.volumes[0]).toContain('mynode');
  });

  it('should create a valid lnd config', () => {
    const node = lnd(
      'mynode',
      'polar-mynode',
      LndVersion.latest,
      'btcnode1',
      8080,
      10009,
    );
    expect(node.image).toContain('lnd');
    expect(node.container_name).toEqual('polar-mynode');
    expect(node.command).toContain('btcnode1');
    expect(node.volumes[0]).toContain('mynode');
  });
});
