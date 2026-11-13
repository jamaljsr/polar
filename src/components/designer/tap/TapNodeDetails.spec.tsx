import React from 'react';
import { shell } from 'electron';
import { fireEvent, waitFor } from '@testing-library/react';
import { Status, TapNode } from 'shared/types';
import { Network } from 'types';
import { initChartFromNetwork } from 'utils/chart';
import { dockerConfigs } from 'utils/constants';
import * as files from 'utils/files';
import {
  defaultTapAsset,
  defaultTapBalance,
  getNetwork,
  renderWithProviders,
  tapServiceMock,
} from 'utils/tests';
import TapDetails from './TapDetails';

jest.mock('utils/files');

describe('TapDetails', () => {
  let network: Network;
  let node: TapNode;

  const renderComponent = (status?: Status, custom = false) => {
    network = getNetwork(1, 'test network', Status.Stopped, 2);
    node = network.nodes.tap[0];

    if (status !== undefined) {
      network.status = status;
      network.nodes.bitcoin.forEach(n => (n.status = status));
      network.nodes.lightning.forEach(n => (n.status = status));
      network.nodes.tap.forEach(n => {
        n.status = status;
        n.errorMsg = status === Status.Error ? 'test-error' : undefined;
      });
    }
    if (custom) {
      network.nodes.tap[0].docker.image = 'custom:image';
    }
    const initialState = {
      network: {
        networks: [network],
      },
      designer: {
        activeId: network.id,
        allCharts: {
          [network.id]: initChartFromNetwork(network),
        },
      },
    };
    const cmp = <TapDetails node={node} />;
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
      expect(
        await findByText(dockerConfigs[node.implementation]?.name),
      ).toBeInTheDocument();
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
      expect(await findByText('Waiting for tapd to come online')).toBeInTheDocument();
    });
  });

  describe('with node Started', () => {
    const mockFiles = files as jest.Mocked<typeof files>;

    beforeEach(() => {
      tapServiceMock.listAssets.mockResolvedValue([
        defaultTapAsset({
          id: 'b4b9058fa9621541ed67d470c9f250e5671e484ebc45ad4ba85d5d2fcf7b2001',
          name: 'LUSD',
          type: 'NORMAL',
          amount: '100',
          genesisPoint:
            '64e4cf735588364a5770712fa8836d6d1464f60227817697664f2c2937619c58:1',
          groupKey: '03dd30e6695fdf314a02a3b733e8cc5a0101dd26112af0516da6b6b4f2f6462882',
        }),
        defaultTapAsset({
          id: 'b4b9058fa9621541ed67d470c9f250e5671e484ebc45ad4ba85d5d2fcf7b2001',
          name: 'LUSD',
          type: 'NORMAL',
          amount: '50',
          genesisPoint:
            '64e4cf735588364a5770712fa8836d6d1464f60227817697664f2c2937619c58:1',
          groupKey: '03dd30e6695fdf314a02a3b733e8cc5a0101dd26112af0516da6b6b4f2f6462882',
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

    it('should display correct Status', async () => {
      const { findByText, node } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Info'));
      expect(await findByText('Status')).toBeInTheDocument();
      expect(await findByText(Status[node.status])).toBeInTheDocument();
    });

    it('should display the number of assets in the header', async () => {
      const { findByText } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Info'));
      expect(await findByText('2 assets')).toBeInTheDocument();
    });

    it('should display list of assets and balances', async () => {
      const { findByText } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Info'));
      expect(await findByText('LUSD')).toBeInTheDocument();
      expect(await findByText('150')).toBeInTheDocument();
      expect(await findByText('PTOKEN')).toBeInTheDocument();
      expect(await findByText('500')).toBeInTheDocument();
    });

    it('should display an error if data fetching fails', async () => {
      tapServiceMock.listAssets.mockRejectedValue(new Error('connection failed'));
      const { findByText } = renderComponent(Status.Started);
      expect(await findByText('connection failed')).toBeInTheDocument();
    });

    it('should not display node info if its undefined', async () => {
      tapServiceMock.listBalances.mockResolvedValue(null as any);
      const { getByText, queryByText, findByText } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Info'));
      await waitFor(() => getByText('Status'));
      expect(queryByText('LUSD')).not.toBeInTheDocument();
      expect(queryByText('150')).not.toBeInTheDocument();
    });

    it('should not display node info for invalid implementation', async () => {
      const { queryByText, findByText } = renderComponent(Status.Started);
      node.implementation = 'invalid' as any;
      fireEvent.click(await findByText('Connect'));
      expect(queryByText('GRPC Host')).not.toBeInTheDocument();
    });

    it('should open API Doc links in the browser', async () => {
      shell.openExternal = jest.fn().mockResolvedValue(true);
      const { getByText, findByText } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Connect'));
      fireEvent.click(getByText('GRPC & REST'));
      await waitFor(() => {
        expect(shell.openExternal).toBeCalledWith(
          'https://lightning.engineering/api-docs/api/tap/',
        );
      });
    });

    it('should handle mint asset button click', async () => {
      const { findByText, node, store } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Actions'));
      fireEvent.click(await findByText('Mint Asset'));
      const { visible, nodeName } = store.getState().modals.mintAsset;
      expect(visible).toEqual(true);
      expect(nodeName).toEqual(node.name);
    });

    it('should handle new address button click', async () => {
      const { findByText, node, store } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Actions'));
      fireEvent.click(await findByText('Create Asset Address'));
      const { visible, nodeName } = store.getState().modals.newAddress;
      expect(visible).toEqual(true);
      expect(nodeName).toEqual(node.name);
    });

    it('should handle send address button click', async () => {
      const { findByText, node, store } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Actions'));
      fireEvent.click(await findByText('Send Asset On-chain'));
      const { visible, nodeName } = store.getState().modals.sendAsset;
      expect(visible).toEqual(true);
      expect(nodeName).toEqual(node.name);
    });

    it('should handle advanced options button click', async () => {
      const { findByText, node, store } = renderComponent(Status.Started);
      fireEvent.click(await findByText('Actions'));
      fireEvent.click(await findByText('Edit Options'));
      const { visible, nodeName } = store.getState().modals.advancedOptions;
      expect(visible).toEqual(true);
      expect(nodeName).toEqual(node.name);
    });

    describe('asset details drawer', () => {
      it('should display the asset drawer', async () => {
        const { findByText, findAllByLabelText } = renderComponent(Status.Started);
        fireEvent.click(await findByText('Info'));
        const buttons = await findAllByLabelText('unordered-list');
        expect(buttons.length).toEqual(2);
        fireEvent.click(buttons[0]);
        expect(await findByText('TAP Asset Info')).toBeInTheDocument();
        expect(await findByText('Type')).toBeInTheDocument();
        expect(await findByText('NORMAL')).toBeInTheDocument();
        expect(await findByText('Asset ID')).toBeInTheDocument();
        expect(await findByText('b4b905...7b2001')).toBeInTheDocument();
        expect(await findByText('Genesis Point')).toBeInTheDocument();
        expect(await findByText('64e4cf...619c58')).toBeInTheDocument();
        expect(await findByText('Group Key')).toBeInTheDocument();
        expect(await findByText('03dd30...462882')).toBeInTheDocument();
        expect(await findByText('100 LUSD')).toBeInTheDocument();
        expect(await findByText('50 LUSD')).toBeInTheDocument();
      });

      it('should display the asset drawer without emission', async () => {
        const { findByText, findAllByLabelText, queryByText } = renderComponent(
          Status.Started,
        );
        fireEvent.click(await findByText('Info'));
        const buttons = await findAllByLabelText('unordered-list');
        expect(buttons.length).toEqual(2);
        fireEvent.click(buttons[1]);
        expect(await findByText('TAP Asset Info')).toBeInTheDocument();
        expect(await findByText('Type')).toBeInTheDocument();
        expect(await findByText('NORMAL')).toBeInTheDocument();
        expect(await findByText('Asset ID')).toBeInTheDocument();
        expect(await findByText('b4b905...7b2002')).toBeInTheDocument();
        expect(await findByText('Genesis Point')).toBeInTheDocument();
        expect(await findByText('64e4cf...9c58:2')).toBeInTheDocument();
        expect(queryByText('Group Key')).not.toBeInTheDocument();
        expect(await findByText('Emission Allowed')).toBeInTheDocument();
        expect(await findByText('False')).toBeInTheDocument();
        expect(await findByText('500 PTOKEN')).toBeInTheDocument();
      });

      it('should handle a node with no assets', async () => {
        const { findByText, findAllByLabelText, store } = renderComponent(Status.Started);
        fireEvent.click(await findByText('Info'));
        const buttons = await findAllByLabelText('unordered-list');
        expect(buttons.length).toEqual(2);
        fireEvent.click(buttons[0]);
        store.getActions().tap.setAssets({ node, assets: [] });
        store.getActions().tap.setBalances({ node, balances: [] });
        expect(
          await findByText(
            'Asset b4b9058fa9621541ed67d470c9f250e5671e484ebc45ad4ba85d5d2fcf7b2001 not found',
          ),
        ).toBeInTheDocument();
      });

      it('should close the asset drawer', async () => {
        const { findByText, findAllByLabelText, findByLabelText } = renderComponent(
          Status.Started,
        );
        fireEvent.click(await findByText('Info'));
        const buttons = await findAllByLabelText('unordered-list');
        expect(buttons.length).toEqual(2);
        fireEvent.click(buttons[0]);
        expect(await findByText('TAP Asset Info')).toBeInTheDocument();
        fireEvent.click(await findByLabelText('Close'));
        expect(findByText('TAP Asset Info')).rejects.toThrow();
      });
    });

    describe('connect options', () => {
      const toggle = (container: Element, value: string) => {
        fireEvent.click(
          container.querySelector(`input[name=authType][value=${value}]`) as Element,
        );
      };

      it('should not fail with undefined node state', async () => {
        tapServiceMock.listAssets.mockResolvedValue(undefined as any);
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
          expect(files.read).toBeCalledTimes(2);
          expect(getAllByText('test-hex')).toHaveLength(2);
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
          expect(files.read).toBeCalledTimes(2);
          expect(getAllByText('test-base64')).toHaveLength(2);
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
      expect(await findByText('Unable to connect to tapd node')).toBeInTheDocument();
      expect(await findByText('test-error')).toBeInTheDocument();
    });
  });
});
