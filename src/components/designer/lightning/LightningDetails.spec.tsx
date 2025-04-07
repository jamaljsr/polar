import React from 'react';
import { shell } from 'electron';
import { fireEvent, waitFor } from '@testing-library/react';
import { LightningNode, Status } from 'shared/types';
import { Network } from 'types';
import * as files from 'utils/files';
import { createCLightningNetworkNode, createLitdNetworkNode } from 'utils/network';
import {
  defaultLitSession,
  defaultStateBalances,
  defaultStateInfo,
  defaultTapAsset,
  defaultTapBalance,
  getNetwork,
  injections,
  lightningServiceMock,
  renderWithProviders,
  tapServiceMock,
  testNodeDocker,
  testRepoState,
} from 'utils/tests';
import LightningDetails from './LightningDetails';

jest.mock('utils/files');

const litdServiceMock = injections.litdService as jest.Mocked<
  typeof injections.litdService
>;

describe('LightningDetails', () => {
  let network: Network;
  let node: LightningNode;

  const renderComponent = (status?: Status, custom = false) => {
    if (status !== undefined) {
      network.status = status;
      network.nodes.bitcoin.forEach(n => (n.status = status));
      network.nodes.lightning.forEach(n => {
        n.status = status;
        n.errorMsg = status === Status.Error ? 'test-error' : undefined;
      });
    }
    if (custom) {
      network.nodes.lightning[0].docker.image = 'custom:image';
    }
    const initialState = {
      network: {
        networks: [network],
      },
      lightning: {
        nodes: {
          alice: {},
        },
      },
    };
    const cmp = <LightningDetails node={node} />;
    const result = renderWithProviders(cmp, { initialState });
    return {
      ...result,
      node,
    };
  };

  const toggle = (container: Element, value: string) => {
    fireEvent.click(
      container.querySelector(`input[name=authType][value=${value}]`) as Element,
    );
  };

  beforeEach(() => {
    network = getNetwork(1, 'test network');
    node = network.nodes.lightning[0];
  });

  describe('with node Stopped', () => {
    it('should display Node Type', async () => {
      const { findByText, node } = renderComponent();
      expect(await findByText('Node Type')).toBeInTheDocument();
      expect(await findByText(node.type)).toBeInTheDocument();
    });

    it('should display Implementation', async () => {
      const { findByText, node } = renderComponent();
      expect(await findByText('Implementation')).toBeInTheDocument();
      expect(await findByText(node.implementation)).toBeInTheDocument();
    });

    it('should display Version', async () => {
      const { findByText, node } = renderComponent();
      expect(await findByText('Version')).toBeInTheDocument();
      expect(await findByText(`v${node.version}`)).toBeInTheDocument();
    });

    it('should display Docker Image', async () => {
      const { findByText } = renderComponent(Status.Stopped, true);
      expect(await findByText('Docker Image')).toBeInTheDocument();
      expect(await findByText('custom:image')).toBeInTheDocument();
    });

    it('should display Status', async () => {
      const { findByText, node } = renderComponent();
      expect(await findByText('Status')).toBeInTheDocument();
      expect(await findByText(Status[node.status])).toBeInTheDocument();
    });

    it('should not display GRPC Host', async () => {
      const { queryByText, getByText } = renderComponent();
      // first wait for the loader to go away
      await waitFor(() => getByText('Status'));
      // then confirm GRPC Host isn't there
      expect(queryByText('GRPC Host')).toBeNull();
    });

    it('should not display start msg in Actions tab', async () => {
      const { queryByText, getByText } = renderComponent(Status.Starting);
      fireEvent.click(getByText('Actions'));
      await waitFor(() => getByText('Restart Node'));
      expect(queryByText('Node needs to be started to perform actions on it')).toBeNull();
    });

    it('should display start msg in Connect tab', async () => {
      const { findByText } = renderComponent(Status.Starting);
      fireEvent.click(await findByText('Connect'));
      expect(
        await findByText('Node needs to be started to view connection info'),
      ).toBeInTheDocument();
    });
  });

  describe('with node Starting', () => {
    it('should display correct Status', async () => {
      const { findByText, node } = renderComponent(Status.Starting);
      fireEvent.click(await findByText('Info'));
      expect(await findByText('Status')).toBeInTheDocument();
      expect(await findByText(Status[node.status])).toBeInTheDocument();
    });

    it('should display info alert', async () => {
      const { findByText } = renderComponent(Status.Starting);
      expect(await findByText('Waiting for LND to come online')).toBeInTheDocument();
    });
  });

  describe('with node Started', () => {
    const mockFiles = files as jest.Mocked<typeof files>;

    beforeEach(() => {
      lightningServiceMock.getInfo.mockResolvedValue(
        defaultStateInfo({
          alias: 'my-node',
          pubkey: 'abcdef',
          syncedToChain: true,
        }),
      );
      lightningServiceMock.getBalances.mockResolvedValue(
        defaultStateBalances({
          confirmed: '10',
          unconfirmed: '20',
          total: '30',
        }),
      );
      lightningServiceMock.getChannels.mockResolvedValue([]);
    });

    it('should display the sync warning', async () => {
      lightningServiceMock.getInfo.mockResolvedValue(
        defaultStateInfo({
          alias: 'my-node',
          pubkey: 'abcdef',
          syncedToChain: false,
        }),
      );
      const { findByText } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Info'));
      expect(
        await findByText('Not in sync with the chain. Mine a block'),
      ).toBeInTheDocument();
    });

    it('should display correct Status', async () => {
      const { findByText, node } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Info'));
      expect(await findByText('Status')).toBeInTheDocument();
      expect(await findByText(Status[node.status])).toBeInTheDocument();
    });

    it('should display Confirmed Balance', async () => {
      const { findByText, findAllByText } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Info'));
      expect(await findByText('Confirmed Balance')).toBeInTheDocument();
      expect(await findAllByText('10 sats')).toHaveLength(2);
    });

    it('should display Unconfirmed Balance', async () => {
      const { findByText } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Info'));
      expect(await findByText('Unconfirmed Balance')).toBeInTheDocument();
      expect(await findByText('20 sats')).toBeInTheDocument();
    });

    it('should display Alias', async () => {
      const { findByText } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Info'));
      expect(await findByText('Alias')).toBeInTheDocument();
      expect(await findByText('my-node')).toBeInTheDocument();
    });

    it('should display Pubkey', async () => {
      const { findByText } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Info'));
      expect(await findByText('Pubkey')).toBeInTheDocument();
      expect(await findByText('abcdef')).toBeInTheDocument();
    });

    it('should display Synced to Chain', async () => {
      const { findByText } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Info'));
      expect(await findByText('Synced to Chain')).toBeInTheDocument();
      expect(await findByText('true')).toBeInTheDocument();
    });

    it('should display the wallet balance in the header', async () => {
      const { findAllByText } = renderComponent(Status.Started);
      expect(await findAllByText('10 sats')).toHaveLength(2);
    });

    it('should display an error if data fetching fails', async () => {
      lightningServiceMock.getInfo.mockRejectedValue(new Error('connection failed'));
      const { findByText } = renderComponent(Status.Started);
      expect(await findByText('connection failed')).toBeInTheDocument();
    });

    it('should not display confirmed/unconfirmed balances', async () => {
      lightningServiceMock.getBalances.mockResolvedValue(null as any);
      const { getByText, queryByText, findByText } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Info'));
      await waitFor(() => getByText('Alias'));
      expect(queryByText('Confirmed Balance')).not.toBeInTheDocument();
      expect(queryByText('Unconfirmed Balance')).not.toBeInTheDocument();
    });

    it('should not display node info if its undefined', async () => {
      lightningServiceMock.getInfo.mockResolvedValue(null as any);
      const { getByText, queryByText, findByText } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Info'));
      await waitFor(() => getByText('Confirmed Balance'));
      expect(queryByText('Alias')).not.toBeInTheDocument();
      expect(queryByText('Pubkey')).not.toBeInTheDocument();
    });

    it('should open API Doc links in the browser', async () => {
      shell.openExternal = jest.fn().mockResolvedValue(true);
      const { getByText, findByText } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Connect'));
      fireEvent.click(getByText('GRPC'));
      await waitFor(() => {
        expect(shell.openExternal).toHaveBeenCalledWith(
          'https://lightning.engineering/api-docs/api/lnd/',
        );
      });
      fireEvent.click(getByText('REST'));
      await waitFor(() => {
        expect(shell.openExternal).toHaveBeenCalledWith(
          'https://lightning.engineering/api-docs/api/lnd/',
        );
      });
    });

    it('should handle incoming open channel button click', async () => {
      const { findByText, node, store } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Actions'));
      fireEvent.click(await findByText('Incoming'));
      const { visible, to } = store.getState().modals.openChannel;
      expect(visible).toEqual(true);
      expect(to).toEqual(node.name);
    });

    it('should handle outgoing open channel button click', async () => {
      const { findByText, node, store } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Actions'));
      fireEvent.click(await findByText('Outgoing'));
      const { visible, from } = store.getState().modals.openChannel;
      expect(visible).toEqual(true);
      expect(from).toEqual(node.name);
    });

    it('should handle pay invoice button click', async () => {
      const { findByText, node, store } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Actions'));
      fireEvent.click(await findByText('Pay Invoice'));
      const { visible, nodeName } = store.getState().modals.payInvoice;
      expect(visible).toEqual(true);
      expect(nodeName).toEqual(node.name);
    });

    it('should handle create invoice button click', async () => {
      const { findByText, node, store } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Actions'));
      fireEvent.click(await findByText('Create Invoice'));
      const { visible, nodeName } = store.getState().modals.createInvoice;
      expect(visible).toEqual(true);
      expect(nodeName).toEqual(node.name);
    });

    it('should handle rename button click', async () => {
      const { findByText, node, store } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Actions'));
      fireEvent.click(await findByText('Rename', { selector: 'span' }));
      const { visible, oldNodeName } = store.getState().modals.renameNode;
      expect(visible).toEqual(true);
      expect(oldNodeName).toEqual(node.name);
    });

    it('should handle advanced options button click', async () => {
      const { findByText, node, store } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Actions'));
      fireEvent.click(await findByText('Edit Options'));
      const { visible, nodeName } = store.getState().modals.advancedOptions;
      expect(visible).toEqual(true);
      expect(nodeName).toEqual(node.name);
    });

    describe('c-lightning', () => {
      beforeEach(() => {
        node = network.nodes.lightning[1];
      });

      it('should display the REST Host', async () => {
        const { getByText, findByText } = renderComponent(Status.Started);
        fireEvent.click(await findByText('Connect'));
        expect(getByText('REST Host')).toBeInTheDocument();
        expect(getByText('http://127.0.0.1:8182')).toBeInTheDocument();
      });

      it('should display the GRPC Host', async () => {
        const { getByText, findByText } = renderComponent(Status.Started);
        fireEvent.click(await findByText('Connect'));
        expect(getByText('GRPC Host')).toBeInTheDocument();
        expect(getByText('127.0.0.1:11002')).toBeInTheDocument();
      });

      it('should not display grpc host for unsupported versions', async () => {
        // add an older version c-lightning node that doesn't support GRPC
        node = createCLightningNetworkNode(
          network,
          '0.10.0', // version before GRPC is supported
          undefined,
          { image: '', command: '' },
        );
        network.nodes.lightning.push(node);
        const { queryByText, findByText } = renderComponent(Status.Started);
        fireEvent.click(await findByText('Connect'));
        expect(queryByText('GRPC Host')).not.toBeInTheDocument();
      });

      it('should open API Doc links in the browser', async () => {
        shell.openExternal = jest.fn().mockResolvedValue(true);
        const { getByText, findByText } = renderComponent(Status.Started);
        fireEvent.click(await findByText('Connect'));
        fireEvent.click(getByText('GRPC'));
        await waitFor(() => {
          expect(shell.openExternal).toBeCalledWith(
            'https://docs.corelightning.org/docs/grpc',
          );
        });
        fireEvent.click(getByText('REST'));
        await waitFor(() => {
          expect(shell.openExternal).toBeCalledWith(
            'https://docs.corelightning.org/docs/rest',
          );
        });
      });
    });

    describe('eclair', () => {
      beforeEach(() => {
        node = network.nodes.lightning[2];
      });

      it('should display the REST Host', async () => {
        const { getByText, findByText } = renderComponent(Status.Started);
        fireEvent.click(await findByText('Connect'));
        expect(getByText('REST Host')).toBeInTheDocument();
        expect(getByText('http://127.0.0.1:8283')).toBeInTheDocument();
      });

      it('should open API Doc links in the browser', async () => {
        shell.openExternal = jest.fn().mockResolvedValue(true);
        const { getByText, findByText } = renderComponent(Status.Started);
        fireEvent.click(await findByText('Connect'));
        fireEvent.click(getByText('REST'));
        await waitFor(() => {
          expect(shell.openExternal).toBeCalledWith('https://acinq.github.io/eclair');
        });
      });
    });

    describe('litd', () => {
      beforeEach(() => {
        network = getNetwork(1, 'test network');
        node = createLitdNetworkNode(
          network,
          testRepoState.images.litd.latest,
          testRepoState.images.litd.compatibility,
          testNodeDocker,
        );
        network.nodes.lightning.push(node);

        tapServiceMock.listAssets.mockResolvedValue([
          defaultTapAsset({
            id: 'b4b9058fa9621541ed67d470c9f250e5671e484ebc45ad4ba85d5d2fcf7b2001',
            name: 'LUSD',
            type: 'NORMAL',
            amount: '100',
            genesisPoint:
              '64e4cf735588364a5770712fa8836d6d1464f60227817697664f2c2937619c58:1',
            groupKey:
              '03dd30e6695fdf314a02a3b733e8cc5a0101dd26112af0516da6b6b4f2f6462882',
          }),
          defaultTapAsset({
            id: 'b4b9058fa9621541ed67d470c9f250e5671e484ebc45ad4ba85d5d2fcf7b2001',
            name: 'LUSD',
            type: 'NORMAL',
            amount: '50',
            genesisPoint:
              '64e4cf735588364a5770712fa8836d6d1464f60227817697664f2c2937619c58:1',
            groupKey:
              '03dd30e6695fdf314a02a3b733e8cc5a0101dd26112af0516da6b6b4f2f6462882',
          }),
          defaultTapAsset({
            id: 'b4b9058fa9621541ed67d470c9f250e5671e484ebc45ad4ba85d5d2fcf7b2002',
            name: 'PTOKEN',
            type: 'NORMAL',
            amount: '500',
            genesisPoint:
              '64e4cf735588364a5770712fa8836d6d1464f60227817697664f2c2937619c58:2',
          }),
        ]);
        tapServiceMock.listBalances.mockResolvedValue([
          defaultTapBalance({
            id: 'b4b9058fa9621541ed67d470c9f250e5671e484ebc45ad4ba85d5d2fcf7b2001',
            name: 'LUSD',
            type: 'NORMAL',
            balance: '150',
            genesisPoint:
              '64e4cf735588364a5770712fa8836d6d1464f60227817697664f2c2937619c58',
          }),
          defaultTapBalance({
            id: 'b4b9058fa9621541ed67d470c9f250e5671e484ebc45ad4ba85d5d2fcf7b2002',
            name: 'PTOKEN',
            type: 'NORMAL',
            balance: '500',
            genesisPoint:
              '64e4cf735588364a5770712fa8836d6d1464f60227817697664f2c2937619c58:2',
          }),
        ]);
      });

      it('should display Taproot Assets on the Info tab', async () => {
        const { findByText, getByText } = renderComponent(Status.Started);
        fireEvent.click(await findByText('Info'));
        expect(getByText('Assets')).toBeInTheDocument();
        expect(getByText('LUSD')).toBeInTheDocument();
        expect(getByText('150')).toBeInTheDocument();
        expect(getByText('PTOKEN')).toBeInTheDocument();
        expect(getByText('500')).toBeInTheDocument();
      });

      it('should display the GRPC Host', async () => {
        const { getByText, findByText } = renderComponent(Status.Started);
        fireEvent.click(await findByText('Connect'));
        expect(getByText('GRPC Host')).toBeInTheDocument();
        expect(getByText('127.0.0.1:8447')).toBeInTheDocument();
      });

      it('should open API Doc links in the browser', async () => {
        shell.openExternal = jest.fn().mockResolvedValue(true);
        const { getByText, findByText } = renderComponent(Status.Started);
        fireEvent.click(await findByText('Connect'));
        fireEvent.click(getByText('https://127.0.0.1:8447', { selector: 'a' }));
        await waitFor(() => {
          expect(shell.openExternal).toHaveBeenCalledWith('https://127.0.0.1:8447');
        });
      });

      it('should display a loader when there is no session data in the store', async () => {
        const { findByText, findByLabelText, store } = renderComponent(Status.Started);
        fireEvent.click(await findByText('Connect'));
        store.getActions().lit.clearNodes();
        expect(await findByLabelText('loading')).toBeInTheDocument();
      });

      it('should display Add Session button', async () => {
        litdServiceMock.listSessions.mockResolvedValue([]);
        const { findByText } = renderComponent(Status.Started);
        fireEvent.click(await findByText('Connect'));
        expect(await findByText('Lightning Node Connect Sessions')).toBeInTheDocument();
        expect(await findByText('Add a new Session')).toBeInTheDocument();
      });

      it('should show the Add Session modal', async () => {
        litdServiceMock.listSessions.mockResolvedValue([]);
        const { findByText, store } = renderComponent(Status.Started);
        fireEvent.click(await findByText('Connect'));
        fireEvent.click(await findByText('Add a new Session'));
        const { visible, nodeName } = store.getState().modals.addLncSession;
        expect(visible).toEqual(true);
        expect(nodeName).toEqual(node.name);
      });

      it('should display the session details drawer', async () => {
        litdServiceMock.listSessions.mockResolvedValue([
          defaultLitSession({ id: 'session-1', label: 'Session 1', state: 'Created' }),
        ]);
        const { findByText, findByLabelText, store } = renderComponent(Status.Started);
        fireEvent.click(await findByText('Connect'));
        expect(await findByText('Session 1')).toBeInTheDocument();
        expect(await findByText('Created')).toBeInTheDocument();
        fireEvent.click(await findByLabelText('unordered-list'));
        const { visible, sessionId } = store.getState().modals.lncSessionInfo;
        expect(visible).toEqual(true);
        expect(sessionId).toEqual('session-1');
        fireEvent.click(await findByLabelText('close'));
        expect(store.getState().modals.lncSessionInfo.visible).toEqual(false);
      });

      it('should display hex values for paths', async () => {
        mockFiles.read.mockResolvedValue('test-hex');
        const { findByText, container, getAllByText } = renderComponent(Status.Started);
        fireEvent.click(await findByText('Connect'));
        toggle(container, 'paths');
        await waitFor(() => getAllByText('TLS Cert'));
        toggle(container, 'hex');
        await waitFor(() => {
          expect(files.read).toHaveBeenCalledTimes(6);
          expect(getAllByText('test-hex')).toHaveLength(6);
        });
      });

      it('should handle advanced options button click', async () => {
        const { findByText, node, store } = renderComponent(Status.Started);
        fireEvent.click(await findByText('Actions'));
        fireEvent.click(await findByText('Edit Options'));
        const { visible, nodeName } = store.getState().modals.advancedOptions;
        expect(visible).toEqual(true);
        expect(nodeName).toEqual(node.name);
      });
    });

    describe('connect options', () => {
      it('should not fail with undefined node state', async () => {
        lightningServiceMock.getInfo.mockResolvedValue(undefined as any);
        const { queryByText, findByText } = renderComponent(Status.Started);
        fireEvent.click(await findByText('Connect'));
        expect(queryByText('http://127.0.0.1:8183')).toBeNull();
      });

      it('should display hex values for paths', async () => {
        mockFiles.read.mockResolvedValue('test-hex');
        const { findByText, container, getAllByText } = renderComponent(Status.Started);
        fireEvent.click(await findByText('Connect'));
        await waitFor(() => getAllByText('TLS Cert'));
        toggle(container, 'hex');
        await waitFor(() => {
          expect(files.read).toBeCalledTimes(4);
          expect(getAllByText('test-hex')).toHaveLength(4);
        });
      });

      it('should display an error if getting hex strings fails', async () => {
        mockFiles.read.mockRejectedValue(new Error('hex-error'));
        const { findByText, container } = renderComponent(Status.Started);
        fireEvent.click(await findByText('Connect'));
        toggle(container, 'hex');
        expect(await findByText('Failed to encode file contents')).toBeInTheDocument();
        expect(await findByText('hex-error')).toBeInTheDocument();
      });

      it('should display base64 values for paths', async () => {
        mockFiles.read.mockResolvedValue('test-base64');
        const { findByText, container, getAllByText } = renderComponent(Status.Started);
        fireEvent.click(await findByText('Connect'));
        await waitFor(() => getAllByText('TLS Cert'));
        toggle(container, 'base64');
        await waitFor(() => {
          expect(files.read).toBeCalledTimes(4);
          expect(getAllByText('test-base64')).toHaveLength(4);
        });
      });

      it('should display an error if getting base64 strings fails', async () => {
        mockFiles.read.mockRejectedValue(new Error('base64-error'));
        const { findByText, container } = renderComponent(Status.Started);
        fireEvent.click(await findByText('Connect'));
        toggle(container, 'base64');
        expect(await findByText('Failed to encode file contents')).toBeInTheDocument();
        expect(await findByText('base64-error')).toBeInTheDocument();
      });

      it('should display LND Connect url', async () => {
        mockFiles.read.mockImplementation((p, e) =>
          Promise.resolve(e === 'hex' ? 'test-hex' : 'test-data'),
        );
        const { findByText, container, getByText, getAllByText } = renderComponent(
          Status.Started,
        );
        fireEvent.click(await findByText('Connect'));
        await waitFor(() => getByText('TLS Cert'));
        toggle(container, 'lndc');
        await waitFor(() => getByText('GRPC Admin Macaroon Url'));
        expect(files.read).toBeCalledTimes(4);
        expect(getAllByText(/lndconnect/)).toHaveLength(6);
      });

      it('should display and error if getting the LND Connect url fails', async () => {
        mockFiles.read.mockImplementation((p, e) =>
          e === 'hex'
            ? Promise.reject(new Error('lndc-error'))
            : Promise.resolve('test-data'),
        );
        const { findByText, container, getByText } = renderComponent(Status.Started);
        fireEvent.click(await findByText('Connect'));
        await waitFor(() => getByText('TLS Cert'));
        toggle(container, 'lndc');
        await waitFor(() => getByText('Unable to create LND Connect url'));
        expect(getByText('lndc-error')).toBeInTheDocument();
      });

      it('should properly handle an unknown implementation', async () => {
        node.implementation = '' as any;
        const { getByText, findByText } = renderComponent(Status.Started);
        fireEvent.click(await findByText('Connect'));
        expect(getByText('API Docs')).toBeInTheDocument();
      });
    });
  });

  describe('with node Error', () => {
    it('should display correct Status', async () => {
      const { findByText, node } = renderComponent(Status.Error);
      expect(await findByText('Status')).toBeInTheDocument();
      expect(await findByText(Status[node.status])).toBeInTheDocument();
    });

    it('should display correct Status', async () => {
      const { findByText } = renderComponent(Status.Error);
      expect(await findByText('Unable to connect to LND node')).toBeInTheDocument();
      expect(await findByText('test-error')).toBeInTheDocument();
    });
  });
});
