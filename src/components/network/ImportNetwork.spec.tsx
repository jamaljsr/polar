import React from 'react';
import * as fs from 'fs-extra';
import { join } from 'path';
import { IChart } from '@mrblenny/react-flow-chart';
import { fireEvent } from '@testing-library/react';
import * as os from 'os';
import { Status } from 'shared/types';
import * as ipc from 'lib/ipc/ipcService';
import { Network } from 'types';
import { initChartFromNetwork } from 'utils/chart';
import { defaultRepoState } from 'utils/constants';
import * as files from 'utils/files';
import { createNetwork } from 'utils/network';
import { getNetwork, renderWithProviders, testManagedImages } from 'utils/tests';
import ImportNetwork from './ImportNetwork';

jest.mock('utils/files');
jest.mock('os');
jest.mock('lib/ipc/ipcService');

const osMock = os as jest.Mocked<typeof os>;
const fsMock = fs as jest.Mocked<typeof fs>;
const filesMock = files as jest.Mocked<typeof files>;
const ipcMock = ipc as jest.Mocked<typeof ipc>;

describe('ImportNetwork component', () => {
  const exportFilePath = join('/', 'tmp', 'polar', 'file', 'export.json');
  let network: Network;
  let chart: IChart;

  const renderComponent = () => {
    const network = getNetwork(1, 'test network');
    const initialState = {
      network: {
        networks: [network],
      },
      designer: {
        activeId: network.id,
        allCharts: {
          1: initChartFromNetwork(network),
        },
      },
    };
    const result = renderWithProviders(<ImportNetwork />, { initialState });

    const fileInput = result.container.querySelector(
      'input[type=file]',
    ) as HTMLInputElement;
    // attach the file to the input so the Uploader can receive it
    const file = new File(['asdf'], 'file.zip');
    file.path = 'file.zip';
    Object.defineProperty(fileInput, 'files', { value: [file] });

    return {
      ...result,
      fileInput,
    };
  };

  beforeEach(() => {
    network = createNetwork({
      id: 1,
      name: 'my-test',
      description: 'network description',
      lndNodes: 2,
      clightningNodes: 1,
      eclairNodes: 1,
      bitcoindNodes: 1,
      tapdNodes: 0,
      litdNodes: 1,
      status: Status.Started,
      repoState: defaultRepoState,
      managedImages: testManagedImages,
      customImages: [],
      manualMineCount: 6,
    });
    chart = initChartFromNetwork(network);
    filesMock.read.mockResolvedValue(JSON.stringify({ network, chart }));
    filesMock.rm.mockResolvedValue();
    fsMock.copy.mockResolvedValue(true as never);
    osMock.tmpdir.mockReturnValue('/tmp');
    osMock.platform.mockReturnValue('darwin');
    const sender = jest.fn().mockResolvedValue(undefined);
    ipcMock.createIpcSender.mockReturnValue(sender);
  });

  it('should display the file upload label', async () => {
    const { getByText } = renderComponent();
    expect(
      getByText(
        'Drag a zip file exported from Polar here, or click to browse for the file',
      ),
    ).toBeInTheDocument();
  });

  it('should navigate home when back button clicked', () => {
    const { getByLabelText, history } = renderComponent();
    const backBtn = getByLabelText('Back');
    expect(backBtn).toBeInTheDocument();
    fireEvent.click(backBtn);
    expect(history.location.pathname).toEqual('/');
  });

  it('should import a network successfully', async () => {
    const { queryByLabelText, findByText, fileInput } = renderComponent();
    expect(queryByLabelText('loading')).not.toBeInTheDocument();
    fireEvent.change(fileInput);
    expect(queryByLabelText('loading')).toBeInTheDocument();
    expect(
      await findByText("Imported network 'my-test' successfully"),
    ).toBeInTheDocument();
  });

  it('should display an error if the import fails', async () => {
    fsMock.copy.mockRejectedValue(new Error('test-error') as never);
    const { findByText, fileInput } = renderComponent();
    fireEvent.change(fileInput);
    expect(await findByText("Could not import 'file.zip'")).toBeInTheDocument();
    expect(await findByText('test-error')).toBeInTheDocument();
  });

  it('should throw if the network is missing', async () => {
    filesMock.read.mockResolvedValue(JSON.stringify({ chart }));
    const { findByText, fileInput } = renderComponent();
    fireEvent.change(fileInput);
    expect(await findByText("Could not import 'file.zip'")).toBeInTheDocument();
    const msg = `${exportFilePath} did not contain a valid network`;
    expect(await findByText(msg)).toBeInTheDocument();
  });

  it('should throw if the network is not valid', async () => {
    filesMock.read.mockResolvedValue(JSON.stringify({ network: {}, chart }));
    const { findByText, fileInput } = renderComponent();
    fireEvent.change(fileInput);
    expect(await findByText("Could not import 'file.zip'")).toBeInTheDocument();
    const msg = `${exportFilePath} did not contain a valid network`;
    expect(await findByText(msg)).toBeInTheDocument();
  });

  it('should throw if the chart is missing', async () => {
    filesMock.read.mockResolvedValue(JSON.stringify({ network }));
    const { findByText, fileInput } = renderComponent();
    fireEvent.change(fileInput);
    expect(await findByText("Could not import 'file.zip'")).toBeInTheDocument();
    const msg = `${exportFilePath} did not contain a valid chart`;
    expect(await findByText(msg)).toBeInTheDocument();
  });

  it('should throw if the chart is not valid', async () => {
    filesMock.read.mockResolvedValue(JSON.stringify({ network, chart: {} }));
    const { findByText, fileInput } = renderComponent();
    fireEvent.change(fileInput);
    expect(await findByText("Could not import 'file.zip'")).toBeInTheDocument();
    const msg = `${exportFilePath} did not contain a valid chart`;
    expect(await findByText(msg)).toBeInTheDocument();
  });

  it('should throw if the network is not supported', async () => {
    osMock.platform.mockReturnValue('win32');
    const { findByText, fileInput } = renderComponent();
    fireEvent.change(fileInput);
    expect(await findByText("Could not import 'file.zip'")).toBeInTheDocument();
    const msg = 'Importing networks with c-lightning nodes is not supported on windows';
    expect(await findByText(msg)).toBeInTheDocument();
  });

  it('should throw for an unknown LN implementation', async () => {
    network.nodes.lightning[0].implementation = 'asdf' as any;
    filesMock.read.mockResolvedValue(JSON.stringify({ network, chart }));
    const { findByText, fileInput } = renderComponent();
    fireEvent.change(fileInput);
    expect(await findByText("Could not import 'file.zip'")).toBeInTheDocument();
    const msg = "Cannot import unknown node implementation 'asdf'";
    expect(await findByText(msg)).toBeInTheDocument();
  });

  it('should import a TAP network successfully', async () => {
    network = getNetwork(1, 'tap network', Status.Stopped, 2);
    chart = initChartFromNetwork(network);
    filesMock.read.mockResolvedValue(JSON.stringify({ network, chart }));
    const { queryByLabelText, findByText, fileInput } = renderComponent();
    expect(queryByLabelText('loading')).not.toBeInTheDocument();
    fireEvent.change(fileInput);
    expect(queryByLabelText('loading')).toBeInTheDocument();
    expect(
      await findByText("Imported network 'tap network' successfully"),
    ).toBeInTheDocument();
  });

  it('should throw for an unknown TAP implementation', async () => {
    network = getNetwork(1, 'tap network', Status.Stopped, 2);
    chart = initChartFromNetwork(network);
    network.nodes.tap[0].implementation = 'asdf' as any;
    filesMock.read.mockResolvedValue(JSON.stringify({ network, chart }));
    const { findByText, fileInput } = renderComponent();
    fireEvent.change(fileInput);
    expect(await findByText("Could not import 'file.zip'")).toBeInTheDocument();
    const msg = "Cannot import unknown node implementation 'asdf'";
    expect(await findByText(msg)).toBeInTheDocument();
  });
});
