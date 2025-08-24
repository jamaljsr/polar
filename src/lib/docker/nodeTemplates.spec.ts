import { bitcoind, lnd, controller, monitor } from './nodeTemplates';

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

  it('should create a valid controller config', () => {
    const netId = 42;
    const node = controller(netId);
    expect(node.image).toContain('project-central-dump-control');
    expect(node.container_name).toBe('polar-n42-control');
    expect(node.hostname).toBe('control');
    expect(node.ports[0]).toBe('39042:3000');
    expect(node.volumes[0]).toBe('./volumes/shared_data:/data');
  });

  it('should create a valid monitor config', () => {
    const containerName = 'polar-n42-control';
    const hostname = 'control';
    const node = monitor(containerName, hostname);
    expect(node.image).toContain('project-central-dump-monitoring');
    expect(node.container_name).toBe('polar-n42-control-monitor');
    expect(node.volumes[0]).toBe('./volumes/shared_data:/data');
    expect(node.network_mode).toBe('container:polar-n42-control');
    expect(node.depends_on).toEqual([hostname, 'control']);
    expect(node.restart).toBe('always');
  });
});
