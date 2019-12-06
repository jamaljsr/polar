import { defaultLndInfo } from 'shared';
import { LightningNode } from 'shared/types';
import { getNetwork } from 'utils/tests';
import { LightningFactory } from './';
import * as clightningApi from './clightning/clightningApi';
import lndProxyClient from './lnd/lndProxyClient';

jest.mock('./lnd/lndProxyClient');
jest.mock('./clightning/clightningApi');

const clightningApiMock = clightningApi as jest.Mocked<typeof clightningApi>;

describe('LightningFactory', () => {
  const network = getNetwork();
  const factory = new LightningFactory();

  it('should return a working LND service', async () => {
    const apiResponse = defaultLndInfo({ identityPubkey: 'asdf' });
    lndProxyClient.getInfo = jest.fn().mockResolvedValue(apiResponse);
    const node = network.nodes.lightning[0];
    const service = factory.getService(node);
    await service.getInfo(node);
    expect(lndProxyClient.getInfo).toBeCalledTimes(1);
  });

  it('should return a working c-lightning service', async () => {
    clightningApiMock.httpGet.mockResolvedValue({
      id: 'asdf',
      binding: [],
    });
    const node = network.nodes.lightning[2];
    const service = factory.getService(node);
    await service.getInfo(node);
    expect(clightningApiMock.httpGet).toBeCalledTimes(1);
  });

  it('should return an unimplemented eclair service', () => {
    const node: LightningNode = {
      ...network.nodes.lightning[0],
      implementation: 'eclair',
    };
    const service = factory.getService(node);
    expect(() => service.getInfo(node)).toThrow(
      'getInfo is not implemented for eclair nodes',
    );
  });
});
