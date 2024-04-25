import { defaultLndInfo } from 'shared';
import { LightningNode } from 'shared/types';
import { getNetwork } from 'utils/tests';
import { LightningFactory } from './';
import * as clightningApi from './clightning/clightningApi';
import * as eclairApi from './eclair/eclairApi';
import lndProxyClient from './lnd/lndProxyClient';

jest.mock('./lnd/lndProxyClient');
jest.mock('./clightning/clightningApi');
jest.mock('./eclair/eclairApi');

const clightningApiMock = clightningApi as jest.Mocked<typeof clightningApi>;
const eclairApiMock = eclairApi as jest.Mocked<typeof eclairApi>;

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
    clightningApiMock.httpPost.mockResolvedValue({
      id: 'asdf',
      binding: [],
    });
    const node = network.nodes.lightning[1];
    const service = factory.getService(node);
    await service.getInfo(node);
    expect(clightningApiMock.httpPost).toBeCalledTimes(1);
  });

  it('should return an unimplemented eclair service', async () => {
    eclairApiMock.httpPost.mockResolvedValue({ id: 'asdf' });
    const node: LightningNode = {
      ...network.nodes.lightning[0],
      implementation: 'eclair',
    };
    const service = factory.getService(node);
    await service.getInfo(node);
    expect(eclairApiMock.httpPost).toBeCalledTimes(1);
  });
});
