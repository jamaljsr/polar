import { defaultStateBalances, defaultStateInfo, getNetwork } from 'utils/tests';
import { clightningService } from './';
import * as clightningApi from './clightningApi';
import * as CLN from './types';

jest.mock('./clightningApi');

const clightningApiMock = clightningApi as jest.Mocked<typeof clightningApi>;

describe('CLightningService', () => {
  const node = getNetwork().nodes.lightning[2];

  it('should get node info', async () => {
    const infoResponse: Partial<CLN.GetInfoResponse> = {
      id: 'asdf',
      alias: '',
      binding: [{ type: 'ipv4', address: '1.1.1.1', port: 9735 }],
      numActiveChannels: 0,
      numPendingChannels: 0,
      numInactiveChannels: 0,
      warningLightningdSync: 'blah',
    };
    clightningApiMock.httpGet.mockResolvedValue(infoResponse);
    const expected = defaultStateInfo({ pubkey: 'asdf', rpcUrl: 'asdf@1.1.1.1:9735' });
    const actual = await clightningService.getInfo(node);
    expect(actual).toEqual(expected);
  });

  it('should get wallet balance', async () => {
    const ballanceResponse = {
      totalBalance: 0,
      confBalance: 1000,
      unconfBalance: 0,
    };
    clightningApiMock.httpGet.mockResolvedValue(ballanceResponse);
    const expected = defaultStateBalances({ confirmed: '1000' });
    const actual = await clightningService.getBalances(node);
    expect(actual).toEqual(expected);
  });

  it('should get new address', async () => {
    const expected = { address: 'abcdef' };
    clightningApiMock.httpGet.mockResolvedValue(expected);
    const actual = await clightningService.getNewAddress(node);
    expect(actual).toEqual(expected);
  });

  it('should get list of channels', async () => {
    const infoResponse: Partial<CLN.GetInfoResponse> = {
      id: 'abc',
      binding: [],
    };
    const chanResponse: Partial<CLN.GetChannelsResponse>[] = [
      {
        id: 'xyz',
        channelId: '',
        fundingTxid: '',
        state: CLN.ChannelState.CHANNELD_NORMAL,
        msatoshiTotal: 0,
        msatoshiToUs: 0,
        fundingAllocationMsat: {
          abc: 100,
          xyz: 0,
        },
      },
    ];
    clightningApiMock.httpGet.mockResolvedValue(chanResponse);
    clightningApiMock.httpGet.mockResolvedValueOnce(infoResponse);
    const expected = [expect.objectContaining({ pubkey: 'xyz' })];
    const actual = await clightningService.getChannels(node);
    expect(actual).toEqual(expected);
  });

  it('should close the channel', async () => {
    const expected = true;
    clightningApiMock.httpDelete.mockResolvedValue(expected);
    const actual = await clightningService.closeChannel(node, 'chanPoint');
    expect(actual).toEqual(expected);
  });

  it('should throw an error for an incorrect node', async () => {
    const lnd = getNetwork().nodes.lightning[0];
    await expect(clightningService.getInfo(lnd)).rejects.toThrow(
      "ClightningService cannot be used for 'LND' nodes",
    );
  });

  describe('openChannel', () => {
    it('should open the channel successfully', async () => {
      const listPeersResponse: Partial<CLN.Peer>[] = [
        { id: 'asdf', connected: true, netaddr: ['1.1.1.1:9735'] },
      ];
      const openChanResponse: Partial<CLN.OpenChannelResponse> = { txid: 'xyz' };
      clightningApiMock.httpGet.mockResolvedValueOnce(listPeersResponse);
      clightningApiMock.httpPost.mockResolvedValueOnce(openChanResponse);

      const expected = { txid: 'xyz', index: 0 };
      const actual = await clightningService.openChannel(
        node,
        'asdf@1.1.1.1:9735',
        '1000',
      );
      expect(actual).toEqual(expected);
      expect(clightningApiMock.httpPost).toBeCalledTimes(1);
      expect(clightningApiMock.httpGet).toBeCalledTimes(1);
    });

    it('should connect peer then open the channel', async () => {
      const listPeersResponse: Partial<CLN.Peer>[] = [{ id: 'fdsa', connected: true }];
      const connectResponse = { id: 'asdf' };
      const openChanResponse: Partial<CLN.OpenChannelResponse> = { txid: 'xyz' };
      clightningApiMock.httpGet.mockResolvedValueOnce(listPeersResponse);
      clightningApiMock.httpPost
        .mockResolvedValueOnce(connectResponse)
        .mockResolvedValueOnce(openChanResponse);

      const expected = { txid: 'xyz', index: 0 };
      const actual = await clightningService.openChannel(
        node,
        'asdf@1.1.1.1:9735',
        '1000',
      );
      expect(actual).toEqual(expected);
      expect(clightningApiMock.httpPost).toBeCalledTimes(2);
      expect(clightningApiMock.httpGet).toBeCalledTimes(1);
    });
  });

  describe('waitUntilOnline', () => {
    it('should wait successfully', async () => {
      clightningApiMock.httpGet.mockResolvedValue({ binding: [] });
      await expect(clightningService.waitUntilOnline(node)).resolves.not.toThrow();
      expect(clightningApiMock.httpGet).toBeCalledTimes(1);
    });

    it('should throw error if waiting fails', async () => {
      clightningApiMock.httpGet.mockRejectedValue(new Error('test-error'));
      await expect(clightningService.waitUntilOnline(node, 0.5, 1)).rejects.toThrow(
        'test-error',
      );
      expect(clightningApiMock.httpGet).toBeCalledTimes(4);
    });
  });
});
