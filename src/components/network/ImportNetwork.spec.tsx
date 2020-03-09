import React from 'react';
import * as fs from 'fs-extra';
import { fireEvent } from '@testing-library/react';
import { PassThrough } from 'stream';
import * as unzipper from 'unzipper';
import { delay } from 'utils/async';
import { initChartFromNetwork } from 'utils/chart';
import * as files from 'utils/files';
import { getNetwork, renderWithProviders } from 'utils/tests';
import ImportNetwork from './ImportNetwork';

jest.mock('utils/files');
jest.mock('unzipper', () => ({
  Extract: jest.fn(),
}));

const fsMock = fs as jest.Mocked<typeof fs>;
const filesMock = files as jest.Mocked<typeof files>;
const unzipperMock = unzipper as jest.Mocked<typeof unzipper>;

describe('ImportNetwork component', () => {
  const network = getNetwork();
  const chart = initChartFromNetwork(network);
  let unzipStream: PassThrough;

  const renderComponent = () => {
    const result = renderWithProviders(<ImportNetwork />);

    // attach the file to the input before triggering change
    const fileInput = result.container.querySelector(
      'input[type=file]',
    ) as HTMLInputElement;
    const file = new File(['asdf'], 'file.zip');
    file.path = 'file.zip';
    Object.defineProperty(fileInput, 'files', { value: [file] });

    return {
      ...result,
      fileInput,
    };
  };

  beforeEach(() => {
    fsMock.pathExists.mockResolvedValue(true as never);
    fsMock.mkdirp.mockResolvedValue(true as never);
    fsMock.copy.mockResolvedValue(true as never);
    filesMock.read.mockResolvedValue(JSON.stringify({ network, chart }));
    fsMock.createReadStream.mockImplementation(() => {
      return {
        pipe: jest.fn(() => {
          // return the mock stream when "pipe()" is called
          unzipStream = new PassThrough();
          return unzipStream;
        }),
      } as any;
    });
    unzipperMock.Extract.mockImplementation(jest.fn());
  });

  afterEach(() => {
    if (unzipStream) unzipStream.destroy();
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
    // close the unzip stream after a small delay
    await delay(100);
    unzipStream.emit('close');
    expect(
      await findByText("Imported network 'my-test' successfully"),
    ).toBeInTheDocument();
  });

  it('should display an error if the import fails', async () => {
    fsMock.copy.mockRejectedValue(new Error('test-error') as never);
    const { findByText, fileInput } = renderComponent();
    fireEvent.change(fileInput);
    // fail the unzip stream after a small delay
    await delay(100);
    unzipStream.emit('error', new Error('test-error'));
    expect(await findByText("Could not import 'file.zip'")).toBeInTheDocument();
    expect(await findByText('test-error')).toBeInTheDocument();
  });
});
