import { bitcoind, lnd, litd } from './nodeTemplates';

describe('nodeTemplates', () => {
  it('should create a valid bitcoind config', () => {
    const node = bitcoind(
      'mynode',
      'polar-mynode',
      'bitcoind:v0.8.0',
      18443,
      19444,
      28334,
      29335,
      '',
    );
    expect(node.image).toContain('bitcoind');
    expect(node.container_name).toEqual('polar-mynode');
    expect(node.volumes[0]).toContain('mynode');
  });

  it('should create a valid lnd config', () => {
    const node = lnd('mynode', 'polar-mynode', 'lnd:v0.8.0', 8080, 10009, 9735, '');
    expect(node.image).toContain('lnd');
    expect(node.container_name).toEqual('polar-mynode');
    expect(node.volumes[0]).toContain('mynode');
  });

  it('should create lnd config with btcd backend volume', () => {
    const node = lnd(
      'mynode',
      'polar-mynode',
      'lnd:v0.8.0',
      8080,
      10009,
      9735,
      '',
      true,
      'btcd1',
    );
    expect(node.image).toContain('lnd');
    expect(node.volumes).toHaveLength(2);
    expect(node.volumes[1]).toContain('btcd/btcd1');
    expect(node.volumes[1]).toContain('/rpc:ro');
  });

  it('should create a valid litd config', () => {
    const node = litd(
      'mynode',
      'polar-mynode',
      'litd:v0.15.0',
      8443,
      10009,
      9735,
      8080,
      '',
    );
    expect(node.image).toContain('litd');
    expect(node.container_name).toEqual('polar-mynode');
    expect(node.volumes[0]).toContain('mynode');
  });

  it('should create litd config with btcd backend volume', () => {
    const node = litd(
      'mynode',
      'polar-mynode',
      'litd:v0.15.0',
      8443,
      10009,
      9735,
      8080,
      '',
      true,
      'btcd1',
    );
    expect(node.image).toContain('litd');
    expect(node.volumes).toHaveLength(4);
    expect(node.volumes[3]).toContain('btcd/btcd1');
    expect(node.volumes[3]).toContain('/rpc:ro');
  });
});
