import { defaultTarodListAssets } from 'shared';
import { getNetwork } from 'utils/tests';
import { TaroFactory } from './';
import tarodProxyClient from './tarod/tarodProxyClient';

jest.mock('./tarod/tarodProxyClient');

describe('TaroFactory', () => {
  const network = getNetwork(1, 'test network', undefined, 2);
  const factory = new TaroFactory();

  it('should return a working tarod service', async () => {
    const apiResponse = defaultTarodListAssets({ assets: [] });
    tarodProxyClient.listAssets = jest.fn().mockResolvedValue(apiResponse);
    const node = network.nodes.taro[0];
    const service = factory.getService(node);
    await service.listAssets(node);
    expect(tarodProxyClient.listAssets).toBeCalledTimes(1);
  });
});
