import { defaultTapdListAssets } from 'shared';
import { getNetwork } from 'utils/tests';
import { TapFactory } from './';
import tapdProxyClient from './tapd/tapdProxyClient';

jest.mock('./tapd/tapdProxyClient');

describe('TapFactory', () => {
  const network = getNetwork(1, 'test network', undefined, 2);
  const factory = new TapFactory();

  it('should return a working tapd service', async () => {
    const apiResponse = defaultTapdListAssets({ assets: [] });
    tapdProxyClient.listAssets = jest.fn().mockResolvedValue(apiResponse);
    const node = network.nodes.tap[0];
    const service = factory.getService(node);
    await service.listAssets(node);
    expect(tapdProxyClient.listAssets).toBeCalledTimes(1);
  });
});
