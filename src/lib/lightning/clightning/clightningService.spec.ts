// import { debug } from 'electron-log';
import fs from 'fs-extra';
import Dockerode from 'dockerode';
import { Socket } from 'socket.io-client';
import { defaultStateInfo, getNetwork } from 'utils/tests';
import * as clightningApi from './clightningApi';
import { CLightningService } from './clightningService';
import * as CLN from './types';

jest.mock('dockerode');
jest.mock('./clightningApi');
jest.mock('fs-extra');
jest.mock('socket.io-client');

const clightningApiMock = clightningApi as jest.Mocked<typeof clightningApi>;
const fsMock = fs as jest.Mocked<typeof fs>;
const mockDockerode = Dockerode as unknown as jest.Mock<Dockerode>;

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
    clightningApiMock.httpPost.mockResolvedValue(infoResponse);
    const expected = defaultStateInfo({ pubkey: 'asdf', rpcUrl: 'asdf@bob:9735' });
    const actual = await clightningService.getInfo(node);
    expect(actual).toEqual(expected);
  });

  it('should get wallet balance', async () => {
    const listFundsResponse: Partial<CLN.ListFundsResponse> = {
      outputs: [
        { status: 'confirmed', amountMsat: 1000000 },
        { status: 'unconfirmed', amountMsat: 1000000 },
      ],
    };
    clightningApiMock.httpPost.mockResolvedValue(listFundsResponse);
    const expected = { confirmed: '1000', total: '2000', unconfirmed: '1000' };
    const actual = await clightningService.getBalances(node);
    expect(actual).toEqual(expected);
  });

  it('should get new address', async () => {
    const newAddrResponse: Partial<CLN.NewAddrResponse> = {
      bech32: 'abcdef',
    };
    const expected = { address: 'abcdef' };
    clightningApiMock.httpPost.mockResolvedValue(newAddrResponse);
    const actual = await clightningService.getNewAddress(node);
    expect(actual).toEqual(expected);
  });

  it('should get list of channels', async () => {
    const chanResponse: Partial<CLN.ListPeerChannelsResponse> = {
      channels: [
        {
          peerId: 'xyz',
          channelId: '884b29be9946380937cba43cefe431b75c1a9ad3c45184e55f444eda09e56150',
          state: CLN.ChannelState.CHANNELD_NORMAL,
          totalMsat: 0,
          toUsMsat: 0,
          opener: 'local',
          private: false,
          shortChannelId: '123x1x1',
          fundingTxid: 'abc',
          fundingOutnum: 0,
        },
      ],
    };
    clightningApiMock.httpPost.mockResolvedValue(chanResponse);
    const expected = [expect.objectContaining({ pubkey: 'xyz' })];
    const actual = await clightningService.getChannels(node);
    expect(actual).toEqual(expected);
  });

  it('should get list of pending channels', async () => {
    // state is CHANNELD_AWAITING_LOCKIN with no shortChannelId
    const chanResponse: Partial<CLN.ListPeerChannelsResponse> = {
      channels: [
        {
          peerId: 'xyz',
          channelId: 'abcd',
          state: CLN.ChannelState.CHANNELD_AWAITING_LOCKIN,
          totalMsat: 0,
          toUsMsat: 0,
          opener: 'local',
          private: false,
          shortChannelId: '',
          fundingTxid: 'abc',
          fundingOutnum: 0,
        },
      ],
    };
    clightningApiMock.httpPost.mockResolvedValue(chanResponse);
    const expected = [expect.objectContaining({ pubkey: 'xyz' })];
    const actual = await clightningService.getChannels(node);
    expect(actual).toEqual(expected);
  });

  it('should not throw error when connecting to peers', async () => {
    const listPeersResponse = {
      peers: [{ id: 'abcd', connected: true, netaddr: ['1.1.1.1:9735'] }],
    } as CLN.ListPeersResponse;
    clightningApiMock.httpPost.mockResolvedValueOnce(listPeersResponse);
    clightningApiMock.httpPost.mockRejectedValue(new Error('peer-error'));
    await expect(clightningService.connectPeers(node, ['abcde'])).resolves.not.toThrow();
  });

  it('should close the channel', async () => {
    const body = { id: 'chanPoint', unilateraltimeout: 1 };
    const expected = true;
    clightningApiMock.httpPost.mockResolvedValue(expected);
    const actual = await clightningService.closeChannel(node, body.id);
    expect(actual).toEqual(expected);
    expect(clightningApiMock.httpPost).toHaveBeenCalledWith(node, 'close', body);
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
      amountMsat: 123000,
      destination: 'asdf',
    };
    clightningApiMock.httpPost.mockResolvedValue(payResponse);
    const actual = await clightningService.payInvoice(node, 'lnbc1invoice');
    expect(actual.preimage).toEqual('preimage');
    expect(actual.amount).toEqual(123);
    expect(actual.destination).toEqual('asdf');
  });

  it('should pay an invoice with an amount', async () => {
    const payResponse: Partial<CLN.PayResponse> = {
      paymentPreimage: 'preimage',
      amountMsat: 123000,
      destination: 'asdf',
    };
    clightningApiMock.httpPost.mockResolvedValue(payResponse);
    const actual = await clightningService.payInvoice(node, 'lnbc1invoice', 1000);
    expect(actual.preimage).toEqual('preimage');
    expect(actual.amount).toEqual(123);
    expect(actual.destination).toEqual('asdf');
  });

  it('should throw if decodeInvoice when called', async () => {
    await expect(clightningService.decodeInvoice(node)).rejects.toThrow(
      'decodeInvoice is not implemented for c-lightning nodes',
    );
  });

  describe('openChannel', () => {
    let listPeersResponse = {
      peers: [{ id: 'fdsa', connected: true, netaddr: ['1.1.1.1:9735'] }],
    } as CLN.ListPeersResponse;
    const connectResponse = { id: 'asdf' };
    const openChanResponse: Partial<CLN.OpenChannelResponse> = {
      txid: 'xyz',
      outnum: 0,
    };

    it('should open the channel successfully', async () => {
      clightningApiMock.httpPost
        .mockResolvedValueOnce(listPeersResponse)
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
      expect(clightningApiMock.httpPost).toHaveBeenCalledTimes(3);
    });

    it('should open a private channel successfully', async () => {
      clightningApiMock.httpPost
        .mockResolvedValueOnce(listPeersResponse)
        .mockResolvedValueOnce(connectResponse)
        .mockResolvedValueOnce(openChanResponse);

      const expected = { txid: 'xyz', index: 0 };
      const actual = await clightningService.openChannel({
        from: node,
        toRpcUrl: 'asdf@1.1.1.1:9735',
        amount: '1000',
        isPrivate: true,
      });
      expect(actual).toEqual(expected);
      expect(clightningApiMock.httpPost).toHaveBeenCalledTimes(3);
      expect(clightningApiMock.httpPost).toHaveBeenLastCalledWith(
        expect.objectContaining({ implementation: 'c-lightning' }),
        'fundchannel',
        { announce: false, feerate: '253perkw', id: 'asdf', amount: '1000' },
      );
    });

    it('should connect peer then open the channel', async () => {
      listPeersResponse = {
        peers: [{ id: 'fdsa', connected: true }],
      } as CLN.ListPeersResponse;
      clightningApiMock.httpPost
        .mockResolvedValueOnce(listPeersResponse)
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
      expect(clightningApiMock.httpPost).toHaveBeenCalledTimes(3);
    });

    it('should open a private channel successfully', async () => {
      clightningApiMock.httpPost
        .mockResolvedValueOnce(listPeersResponse)
        .mockResolvedValueOnce(connectResponse)
        .mockResolvedValueOnce(openChanResponse);

      const expected = { txid: 'xyz', index: 0 };
      const actual = await clightningService.openChannel({
        from: node,
        toRpcUrl: 'asdf@1.1.1.1:9735',
        amount: '1000',
        isPrivate: true,
      });
      expect(actual).toEqual(expected);
      expect(clightningApiMock.httpPost).toHaveBeenCalledTimes(3);
      expect(clightningApiMock.httpPost).toHaveBeenLastCalledWith(
        expect.objectContaining({ implementation: 'c-lightning' }),
        'fundchannel',
        { announce: false, feerate: '253perkw', id: 'asdf', amount: '1000' },
      );
    });

    it('should connect peer then open the channel', async () => {
      listPeersResponse = {
        peers: [{ id: 'fdsa', connected: true }],
      } as CLN.ListPeersResponse;
      clightningApiMock.httpPost
        .mockResolvedValueOnce(listPeersResponse)
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
      expect(clightningApiMock.httpPost).toHaveBeenCalledTimes(3);
    });
  });

  describe('waitUntilOnline', () => {
    beforeEach(() => {
      fsMock.pathExists = jest.fn().mockResolvedValue(true);
    });

    it('should throw an error for an incorrect node', async () => {
      const lnd = getNetwork().nodes.lightning[0];
      await expect(clightningService.waitUntilOnline(lnd, 0.1, 0.3)).rejects.toThrow(
        "CLightningService cannot be used for 'LND' nodes",
      );
    });

    it('should wait successfully', async () => {
      clightningApiMock.httpPost.mockResolvedValue({ binding: [] });
      await expect(clightningService.waitUntilOnline(node)).resolves.not.toThrow();
      expect(clightningApiMock.httpPost).toHaveBeenCalledTimes(1);
    });

    it('should throw error if waiting fails', async () => {
      clightningApiMock.httpPost.mockRejectedValue(new Error('test-error'));
      await expect(clightningService.waitUntilOnline(node, 0.5, 1)).rejects.toThrow(
        'test-error',
      );
      expect(clightningApiMock.httpPost).toHaveBeenCalledTimes(4);
    });
  });

  describe('subscribeChannelEvents', () => {
    it('should successfully subscribe to channel events', async () => {
      const mockCallback = jest.fn();

      jest.spyOn(clightningApi, 'getListener').mockResolvedValue({
        on: jest.fn().mockImplementation((event, cb) => {
          const message = {
            channel_state_changed: {
              peer_id:
                '0226ad0baeb164fafda0d9670c706d6320a51a7986623ccf63d16b8d8dd76d9ef6',
              channel_id:
                'ac7f0f83163ac57ed3a63a16576b8e69a3f881e338ce8a2ab2ce2fa4a41a40a0',
              short_channel_id: '108x1x0',
              timestamp: '2024-04-26T06:45:43.521Z',
              old_state: 'unknown',
              new_state: CLN.ChannelState.CHANNELD_AWAITING_LOCKIN,
              cause: 'user',
              message: 'new channel opened',
            },
          };
          cb(message);
          message.channel_state_changed.new_state = CLN.ChannelState.CHANNELD_NORMAL;
          cb(message);
          message.channel_state_changed.new_state = CLN.ChannelState.ONCHAIN;
          cb(message);
          message.channel_state_changed.new_state = CLN.ChannelState.CLOSED;
          cb(message);
          // send a different message to test that it can handle unknown messages
          cb({
            block_added: {
              hash: '13fcc5a69db722ccd16b02a953128a0bf1d3aed833ffdc8a63854293da1dedcd',
              height: 101,
            },
          });
        }),
      } as unknown as Socket);

      await clightningService.subscribeChannelEvents(node, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith({ type: 'Pending' });
      expect(mockCallback).toHaveBeenCalledWith({ type: 'Open' });
      expect(mockCallback).toHaveBeenCalledWith({ type: 'Closed' });

      expect(clightningApi.getListener).toHaveBeenCalledWith(node);
    });

    it('should throw an error when the implementation is not eclair', async () => {
      const lndNode = getNetwork().nodes.lightning[0];
      const mockCallback = jest.fn();
      await expect(
        clightningService.subscribeChannelEvents(lndNode, mockCallback),
      ).rejects.toThrow("CLightningService cannot be used for 'LND' nodes");
    });

    it('should add listener to node', async () => {
      clightningService.addListenerToNode(node);
      expect(clightningApi.setupListener).toHaveBeenCalled();
    });

    it('should remove Listener', async () => {
      clightningService.removeListener(node);
      expect(clightningApi.removeListener).toHaveBeenCalled();
    });
  });

  describe('createRune', () => {
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
    const listContainers = mockDockerode.prototype.listContainers as jest.Mock;
    const getContainer = mockDockerode.prototype.getContainer as jest.Mock;
    const streamMock = jest.fn();
    const dockerExecOutput = `
      lightning-cli --network regtest createrune
      exit
      [?2004hclightning@bob:/$ lightning-cli --network regtest createrune
      [?2004l
      {
        "rune": "TGrQQlUxyhs_Ek6XSqyAQS7wLGqQqpdkgvZ5b-ttttY9MA==",
        "unique_id": "0",
      }
      [?2004hclightning@bob:/$ exit
      [?2004l
      exit
    `;

    beforeEach(() => {
      listContainers.mockResolvedValue([
        {
          Id: '123',
          Names: [`/polar-n${node.networkId}-${node.name}`],
        },
      ]);
      getContainer.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          start: jest.fn().mockResolvedValue({
            on: streamMock,
            write: jest.fn(),
            destroy: jest.fn(),
          }),
        }),
      });
    });

    it('should throw an error if the container is not found', async () => {
      listContainers.mockResolvedValueOnce([]);
      expect(clightningService.waitUntilOnline(node, 0.1, 0.3)).rejects.toThrow(
        'Docker container not found: polar-n1-bob',
      );

      getContainer.mockReturnValueOnce(undefined);
      expect(clightningService.waitUntilOnline(node, 0.1, 0.3)).rejects.toThrow(
        'Docker container not found: polar-n1-bob',
      );
    });

    it('should throw an error if there no rune in the output', async () => {
      clightningApiMock.httpPost.mockResolvedValue(infoResponse);
      streamMock.mockImplementation((event: string, cb: (arg: any) => void) => {
        cb(Buffer.from('no rune here'));
      });
      expect(clightningService.waitUntilOnline(node, 0.1, 0.3)).rejects.toThrow(
        'Failed to create CLN rune',
      );
    });

    it('should create a rune', async () => {
      clightningApiMock.httpPost.mockResolvedValue(infoResponse);
      streamMock.mockImplementation((event: string, cb: (arg: any) => void) => {
        cb(Buffer.from(dockerExecOutput));
      });

      await clightningService.waitUntilOnline(node, 0.1, 0.3);

      expect(listContainers).toHaveBeenCalledTimes(1);
      expect(clightningApiMock.httpPost).toHaveBeenCalledTimes(1);
    });
  });
});
