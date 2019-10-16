import { LndVersion } from 'types';
import ComposeFile from './composeFile';

describe('ComposeFile', () => {
  let composeFile = new ComposeFile();

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
    composeFile.addBitcoind('bitcoind1', '0.18.1', 18443);
    composeFile.addLnd('lnd1', LndVersion.latest, 'bitcoind1', 8080, 10009);
    expect(Object.keys(composeFile.content.services).length).toEqual(2);
  });

  it('should add a bitcoind config', () => {
    composeFile.addBitcoind('bitcoind1', '0.18.1', 18443);
    expect(composeFile.content.services.bitcoind1).not.toBeUndefined();
  });

  it('should create the correct bitcoind docker compose values', () => {
    composeFile.addBitcoind('bitcoind1', '0.18.1', 18443);
    const service = composeFile.content.services.bitcoind1;
    expect(service.image).toContain('bitcoind');
    expect(service.container_name).toEqual('bitcoind1');
    expect(service.volumes[0]).toContain('bitcoind1');
  });

  it('should add an lnd config', () => {
    composeFile.addLnd('lnd1', LndVersion.latest, 'bitcoind1', 8080, 10009);
    expect(composeFile.content.services.lnd1).not.toBeUndefined();
  });

  it('should create the correct lnd docker compose values', () => {
    composeFile.addLnd('lnd1', LndVersion.latest, 'bitcoind1', 8080, 10009);
    const service = composeFile.content.services.lnd1;
    expect(service.image).toContain('lnd');
    expect(service.container_name).toEqual('lnd1');
    expect(service.command).toContain('bitcoind1');
    expect(service.volumes[0]).toContain('lnd1');
  });
});
