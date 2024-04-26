import { debug } from 'electron-log';
import { defaultStateBalances, defaultStateInfo, getNetwork } from 'utils/tests';
import * as clightningApi from './clightningApi';
import { CLightningService } from './clightningService';
import * as CLN from './types';

jest.mock('./clightningApi');

const clightningApiMock = clightningApi as jest.Mocked<typeof clightningApi>;

describe('CLightningService', () => {
  const node = getNetwork().nodes.lightning[1];
  let clightningService: CLightningService;

  beforeEach(() => {
    clightningService = new CLightningService();
  });

  it('should get node info', async () => {
    const infoResponse: Partial<CLN.GetInfoResponse> = {
      id: 'asdf',
      alias: '',
      binding: [{ type: 'ipv4', address: '0.0.0.0', port: 9735 }],
      blockheight: 0,
      numActiveChannels: 0,
      numPendingChannels: 0,
      numInactiveChannels: 0,
      warningLightningdSync: 'blah',
    };
    clightningApiMock.httpGet.mockResolvedValue(infoResponse);
    const expected = defaultStateInfo({ pubkey: 'asdf', rpcUrl: 'asdf@bob:9735' });
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

  it('should get list of channels with a funding txid', async () => {
    const infoResponse: Partial<CLN.GetInfoResponse> = {
      id: 'abc',
      binding: [],
    };
    const chanResponse: Partial<CLN.GetChannelsResponse>[] = [
      {
        id: 'xyz',
        channelId: '',
        fundingTxid: 'bec9d46e09f7787f16e4c190b3469dab2faa41899427402d0cb558c66e2757fa',
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

  it('should not throw error when connecting to peers', async () => {
    const listPeersResponse: Partial<CLN.Peer>[] = [
      { id: 'asdf', connected: true, netaddr: ['1.1.1.1:9735'] },
    ];
    clightningApiMock.httpGet.mockResolvedValueOnce(listPeersResponse);
    clightningApiMock.httpPost.mockRejectedValue(new Error('peer-error'));
    await expect(clightningService.connectPeers(node, ['fdsa'])).resolves.not.toThrow();
  });

  it('should close the channel', async () => {
    const expected = true;
    clightningApiMock.httpDelete.mockResolvedValue(expected);
    const actual = await clightningService.closeChannel(node, 'chanPoint');
    expect(actual).toEqual(expected);
  });

  it('should create an invoice', async () => {
    const expected = 'lnbc1invoice';
    const invResponse: Partial<CLN.InvoiceResponse> = {
      bolt11: expected,
    };
    clightningApiMock.httpPost.mockResolvedValue(invResponse);
    const actual = await clightningService.createInvoice(node, 1000);
    expect(actual).toEqual(expected);
  });

  it('should pay an invoice', async () => {
    const payResponse: Partial<CLN.PayResponse> = {
      paymentPreimage: 'preimage',
      msatoshi: 123000,
      destination: 'asdf',
    };
    clightningApiMock.httpPost.mockResolvedValue(payResponse);
    const actual = await clightningService.payInvoice(node, 'lnbc1invoice');
    expect(actual.preimage).toEqual('preimage');
    expect(actual.amount).toEqual(123);
    expect(actual.destination).toEqual('asdf');
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
      const actual = await clightningService.openChannel({
        from: node,
        toRpcUrl: 'asdf@1.1.1.1:9735',
        amount: '1000',
        isPrivate: false,
      });
      expect(actual).toEqual(expected);
      expect(clightningApiMock.httpPost).toHaveBeenCalledTimes(1);
      expect(clightningApiMock.httpGet).toHaveBeenCalledTimes(1);
    });

    it('should open a private channel successfully', async () => {
      const listPeersResponse: Partial<CLN.Peer>[] = [
        { id: 'asdf', connected: true, netaddr: ['1.1.1.1:9735'] },
      ];
      const openChanResponse: Partial<CLN.OpenChannelResponse> = { txid: 'xyz' };
      clightningApiMock.httpGet.mockResolvedValueOnce(listPeersResponse);
      clightningApiMock.httpPost.mockResolvedValueOnce(openChanResponse);

      const expected = { txid: 'xyz', index: 0 };
      const actual = await clightningService.openChannel({
        from: node,
        toRpcUrl: 'asdf@1.1.1.1:9735',
        amount: '1000',
        isPrivate: true,
      });
      expect(actual).toEqual(expected);
      expect(clightningApiMock.httpPost).toHaveBeenCalledTimes(1);
      expect(clightningApiMock.httpPost).toHaveBeenLastCalledWith(
        expect.objectContaining({ implementation: 'c-lightning' }),
        'channel/openChannel',
        { announce: 'false', feeRate: '253perkw', id: 'asdf', satoshis: '1000' },
      );
      expect(clightningApiMock.httpGet).toHaveBeenCalledTimes(1);
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
      const actual = await clightningService.openChannel({
        from: node,
        toRpcUrl: 'asdf@1.1.1.1:9735',
        amount: '1000',
        isPrivate: false,
      });
      expect(actual).toEqual(expected);
      expect(clightningApiMock.httpPost).toHaveBeenCalledTimes(2);
      expect(clightningApiMock.httpGet).toHaveBeenCalledTimes(1);
    });
  });

  describe('waitUntilOnline', () => {
    it('should wait successfully', async () => {
      clightningApiMock.httpGet.mockResolvedValue({ binding: [] });
      await expect(clightningService.waitUntilOnline(node)).resolves.not.toThrow();
      expect(clightningApiMock.httpGet).toHaveBeenCalledTimes(1);
    });

    it('should throw error if waiting fails', async () => {
      clightningApiMock.httpGet.mockRejectedValue(new Error('test-error'));
      await expect(clightningService.waitUntilOnline(node, 0.5, 1)).rejects.toThrow(
        'test-error',
      );
      expect(clightningApiMock.httpGet).toHaveBeenCalledTimes(4);
    });
  });

  describe('removeListener', () => {
    jest.spyOn(window, 'clearInterval');

    it('should remove channel if channel exists in cache', async () => {
      const intervalId = setInterval(() => {}, 1000);
      clightningService.channelCaches = {
        [node.ports.rest!]: {
          intervalId,
          channels: [],
        },
      };
      await clightningService.removeListener(node);
      expect(clearInterval).toHaveBeenCalledTimes(1);
      expect(clearInterval).toHaveBeenCalledWith(intervalId);
    });

    it('should do nothing if channel does not exists in cache', async () => {
      clightningService.channelCaches = {
        [1234]: {
          // using a random node port
          intervalId: setInterval(() => {}, 1000),
          channels: [],
        },
      };
      await clightningService.removeListener(node);
      expect(clearInterval).not.toHaveBeenCalled();
    });
  });

  describe('subscribeChannelEvents', () => {
    it('should create a channel cache, set interval, and call checkChannels', async () => {
      jest.useFakeTimers();
      const mockCallback = jest.fn();

      jest.spyOn(clightningService, 'checkChannels').mockReturnValue(Promise.resolve());

      await clightningService.subscribeChannelEvents(node, mockCallback);

      expect(setInterval).toHaveBeenCalledTimes(1);
      expect(setInterval).toHaveBeenLastCalledWith(expect.any(Function), 30 * 1000);

      // Fast-forward time by 30 seconds to trigger the interval callback
      jest.advanceTimersByTime(30 * 1000);

      expect(clightningService.checkChannels).toHaveBeenCalledTimes(1);
      expect(clightningService.checkChannels).toHaveBeenLastCalledWith(
        node,
        mockCallback,
      );

      expect(clightningService.channelCaches).toBeDefined();
      jest.useRealTimers();
    });

    it('should do nothing if node has already subscribed to channel event', async () => {
      jest.useFakeTimers();
      const mockCallback = jest.fn();

      jest.spyOn(clightningService, 'checkChannels').mockReturnValue(Promise.resolve());

      await clightningService.subscribeChannelEvents(node, mockCallback);
      jest.advanceTimersByTime(30 * 1000);

      expect(setInterval).toHaveBeenCalledTimes(1);
      expect(clightningService.checkChannels).toHaveBeenCalledTimes(1);

      // the second time should not call setInterval or checkChannels again
      await clightningService.subscribeChannelEvents(node, mockCallback);

      expect(setInterval).toHaveBeenCalledTimes(1);
      expect(clightningService.checkChannels).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });

    it('should throw an error when the implementation is not c-lightning', async () => {
      const lndNode = getNetwork().nodes.lightning[0];
      const mockCallback = jest.fn();
      await expect(
        clightningService.subscribeChannelEvents(lndNode, mockCallback),
      ).rejects.toThrow("ClightningService cannot be used for 'LND' nodes");
    });

    it('checkChannels should call callback with channel events', async () => {
      const mockCallback = jest.fn();
      const mockChannels: Partial<CLN.GetChannelsResponse>[] = [
        {
          channelId: '01aa',
          state: CLN.ChannelState.CHANNELD_AWAITING_LOCKIN,
        },
        {
          channelId: '04bb',
          state: CLN.ChannelState.CHANNELD_NORMAL,
        },
        {
          channelId: '07cc',
          state: CLN.ChannelState.CLOSED,
        },
      ];
      clightningApiMock.httpGet.mockResolvedValue(mockChannels);

      await clightningService.checkChannels(node, mockCallback);

      expect(mockCallback).toHaveBeenCalledTimes(3);
      expect(mockCallback).toHaveBeenCalledWith({ type: 'Pending' });
      expect(mockCallback).toHaveBeenCalledWith({ type: 'Open' });
      expect(mockCallback).toHaveBeenCalledWith({ type: 'Closed' });
    });

    it('checkChannels edge case for empty apiChannels but cache channels is not empty', async () => {
      const mockCallback = jest.fn();
      clightningService.channelCaches = {
        [node.ports.rest!]: {
          intervalId: setInterval(() => {}, 1000),
          channels: [
            { channelId: '01ff', status: 'Opening' },
            { channelId: '04bb', status: 'Open' },
          ],
        },
      };
      clightningApiMock.httpGet.mockResolvedValue([]);

      await clightningService.checkChannels(node, mockCallback);

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith({ type: 'Closed' });
    });

    it('checkChannels should call callback for only new channel returned by api', async () => {
      const mockCallback = jest.fn();
      clightningService.channelCaches = {
        [node.ports.rest!]: {
          intervalId: setInterval(() => {}, 1000),
          channels: [
            { channelId: '01ff', status: 'Opening' },
            { channelId: '04bb', status: 'Open' },
          ],
        },
      };
      const mockChannels: Partial<CLN.GetChannelsResponse>[] = [
        {
          channelId: '01ff',
          state: CLN.ChannelState.CHANNELD_AWAITING_LOCKIN,
        },
        {
          channelId: '04bb',
          state: CLN.ChannelState.CHANNELD_NORMAL,
        },
        {
          channelId: '07cc',
          state: CLN.ChannelState.CLOSED, // New channel returned by api
        },
      ];
      clightningApiMock.httpGet.mockResolvedValue(mockChannels);

      await clightningService.checkChannels(node, mockCallback);

      expect(mockCallback).toHaveBeenCalledTimes(1); // called once for new channel
      expect(mockCallback).toHaveBeenCalledWith({ type: 'Closed' });
    });

    it('checkChannels should call callback if channel state has been updated', async () => {
      const mockCallback = jest.fn();
      clightningService.channelCaches = {
        [node.ports.rest!]: {
          intervalId: setInterval(() => {}, 1000),
          channels: [
            { channelId: '01ff', status: 'Opening' },
            { channelId: '04bb', status: 'Open' },
          ],
        },
      };
      const mockChannels: Partial<CLN.GetChannelsResponse>[] = [
        {
          channelId: '01ff',
          state: CLN.ChannelState.CHANNELD_AWAITING_LOCKIN,
        },
        {
          channelId: '04bb',
          state: CLN.ChannelState.CLOSED, // updated channel state from open to closed
        },
      ];
      clightningApiMock.httpGet.mockResolvedValue(mockChannels);

      await clightningService.checkChannels(node, mockCallback);

      expect(mockCallback).toHaveBeenCalledTimes(1); // called once for updated channel state
      expect(mockCallback).toHaveBeenCalledWith({ type: 'Closed' });
    });

    it('should add listener to node, log a debug message with the node port', async () => {
      await clightningService.addListenerToNode(node);
      expect(debug).toHaveBeenCalledWith(
        'addListenerToNode CLN on port: ',
        node.ports.rest,
      );
    });
  });
});
