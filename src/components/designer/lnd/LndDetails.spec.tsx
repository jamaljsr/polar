import React from 'react';
import { shell } from 'electron';
import { fireEvent, wait, waitForElement } from '@testing-library/dom';
import { defaultListChannels, defaultPendingChannels } from 'shared';
import { Status } from 'shared/types';
import { LndLibrary } from 'types';
import * as files from 'utils/files';
import { groupNodes } from 'utils/network';
import { getNetwork, injections, renderWithProviders } from 'utils/tests';
import { defaultInfo } from 'utils/tests/nodeStateDefaults';
import LndDetails from './LndDetails';

jest.mock('utils/files');

describe('LndDetails', () => {
  const renderComponent = (status?: Status) => {
    const network = getNetwork(1, 'test network', status);
    if (status === Status.Error) {
      network.nodes.lightning.forEach(n => (n.errorMsg = 'test-error'));
    }
    const initialState = {
      network: {
        networks: [network],
      },
      lnd: {
        nodes: {
          alice: {},
        },
      },
    };
    const node = groupNodes(network).lnd[0];
    const cmp = <LndDetails node={node} />;
    const result = renderWithProviders(cmp, { initialState });
    return {
      ...result,
      node,
    };
  };

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

    it('should display Status', async () => {
      const { findByText, node } = renderComponent();
      expect(await findByText('Status')).toBeInTheDocument();
      expect(await findByText(Status[node.status])).toBeInTheDocument();
    });

    it('should not display GRPC Host', async () => {
      const { queryByText, getByText } = renderComponent();
      // first wait for the loader to go away
      await waitForElement(() => getByText('Status'));
      // then confirm GRPC Host isn't there
      expect(queryByText('GRPC Host')).toBeNull();
    });

    it('should not display start msg in Actions tab', async () => {
      const { queryByText, getByText } = renderComponent(Status.Starting);
      await wait(() => fireEvent.click(getByText('Actions')));
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
    const lndServiceMock = injections.lndService as jest.Mocked<LndLibrary>;
    const mockFiles = files as jest.Mocked<typeof files>;

    beforeEach(() => {
      lndServiceMock.getInfo.mockResolvedValue(
        defaultInfo({
          alias: 'my-node',
          pubkey: 'abcdef',
          syncedToChain: true,
        }),
      );
      lndServiceMock.getWalletBalance.mockResolvedValue({
        confirmedBalance: '10',
        unconfirmedBalance: '20',
        totalBalance: '30',
      });
      lndServiceMock.listChannels.mockResolvedValue(defaultListChannels({}));
      lndServiceMock.pendingChannels.mockResolvedValue(defaultPendingChannels({}));
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
      lndServiceMock.getInfo.mockRejectedValue(new Error('connection failed'));
      const { findByText } = renderComponent(Status.Started);
      expect(await findByText('connection failed')).toBeInTheDocument();
    });

    it('should not display confirmed/unconfirmed balances', async () => {
      lndServiceMock.getWalletBalance.mockResolvedValue(null as any);
      const { getByText, queryByText, findByText } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Info'));
      await wait(() => getByText('Alias'));
      expect(queryByText('Confirmed Balance')).not.toBeInTheDocument();
      expect(queryByText('Unconfirmed Balance')).not.toBeInTheDocument();
    });

    it('should not display LND info if its undefined', async () => {
      lndServiceMock.getInfo.mockResolvedValue(null as any);
      const { getByText, queryByText, findByText } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Info'));
      await wait(() => getByText('Confirmed Balance'));
      expect(queryByText('Alias')).not.toBeInTheDocument();
      expect(queryByText('Pubkey')).not.toBeInTheDocument();
    });

    it('should open API Doc links in the browser', async () => {
      shell.openExternal = jest.fn().mockResolvedValue(true);
      const { getByText, findByText } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Connect'));
      await wait(() => fireEvent.click(getByText('GRPC')));
      expect(shell.openExternal).toBeCalledWith('https://api.lightning.community/');
      await wait(() => fireEvent.click(getByText('REST')));
      expect(shell.openExternal).toBeCalledWith('https://api.lightning.community/rest/');
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

    describe('connect options', () => {
      const toggle = (container: HTMLElement, value: string) => {
        fireEvent.click(
          container.querySelector(`input[name=authType][value=${value}]`) as Element,
        );
      };

      it('should display hex values for paths', async () => {
        mockFiles.read.mockResolvedValue('test-hex');
        const { findByText, container, getAllByText } = renderComponent(Status.Started);
        fireEvent.click(await findByText('Connect'));
        await waitForElement(() => getAllByText('TLS Cert'));
        toggle(container, 'hex');
        await wait(() => {
          expect(files.read).toBeCalledTimes(3);
          expect(getAllByText('test-hex')).toHaveLength(3);
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
        await waitForElement(() => getAllByText('TLS Cert'));
        toggle(container, 'base64');
        await wait(() => {
          expect(files.read).toBeCalledTimes(3);
          expect(getAllByText('test-base64')).toHaveLength(3);
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
        const { findByText, container, getByText } = renderComponent(Status.Started);
        fireEvent.click(await findByText('Connect'));
        await waitForElement(() => getByText('TLS Cert'));
        toggle(container, 'lndc');
        await waitForElement(() => getByText('LND Connect Url'));
        expect(files.read).toBeCalledTimes(2);
        expect(getByText(/lndconnect/)).toBeInTheDocument();
      });

      it('should display and error if getting the LND Connect url fails', async () => {
        mockFiles.read.mockImplementation((p, e) =>
          e === 'hex'
            ? Promise.reject(new Error('lndc-error'))
            : Promise.resolve('test-data'),
        );
        const { findByText, container, getByText } = renderComponent(Status.Started);
        fireEvent.click(await findByText('Connect'));
        await waitForElement(() => getByText('TLS Cert'));
        toggle(container, 'lndc');
        await waitForElement(() => getByText('LND Connect Url'));
        expect(getByText('Unable to create LND Connect url')).toBeInTheDocument();
        expect(getByText('lndc-error')).toBeInTheDocument();
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
