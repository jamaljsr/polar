import React from 'react';
import { waitFor } from '@testing-library/react';
import { CLightningNode, LndNode } from 'shared/types';
import * as files from 'utils/files';
import { getNetwork, renderWithProviders } from 'utils/tests';
import { ConnectionInfo } from '../ConnectTab';
import { EncodedStrings } from './';

jest.mock('utils/files');

const filesMock = files as jest.Mocked<typeof files>;

describe('EncodedStrings', () => {
  const network = getNetwork();

  const renderComponent = (
    credentials: ConnectionInfo['credentials'],
    encoding: 'hex' | 'base64',
  ) => {
    const cmp = <EncodedStrings credentials={credentials} encoding={encoding} />;
    return renderWithProviders(cmp);
  };

  beforeEach(() => {
    filesMock.read.mockResolvedValue('file-content');
  });

  it('should display credentials for LND', async () => {
    const lnd = network.nodes.lightning[0] as LndNode;
    const lndCreds: ConnectionInfo['credentials'] = {
      admin: lnd.paths.adminMacaroon,
      readOnly: lnd.paths.readonlyMacaroon,
      cert: lnd.paths.tlsCert,
    };
    const { getByText } = renderComponent(lndCreds, 'hex');
    await waitFor(() => getByText('TLS Cert'));
    expect(getByText('TLS Cert')).toBeInTheDocument();
    expect(getByText('Admin Macaroon')).toBeInTheDocument();
    expect(getByText('Read-only Macaroon')).toBeInTheDocument();
    expect(filesMock.read).toBeCalledWith(expect.stringContaining('tls.cert'), 'hex');
    expect(filesMock.read).toBeCalledWith(
      expect.stringContaining('admin.macaroon'),
      'hex',
    );
    expect(filesMock.read).toBeCalledWith(
      expect.stringContaining('readonly.macaroon'),
      'hex',
    );
  });

  it('should display credentials for Core Lightning', async () => {
    const cln = network.nodes.lightning[1] as CLightningNode;
    const clnCreds: ConnectionInfo['credentials'] = {
      admin: cln.paths.macaroon,
      cert: cln.paths.tlsCert,
      certKey: cln.paths.tlsKey,
    };
    const { getByText } = renderComponent(clnCreds, 'hex');
    await waitFor(() => getByText('TLS Cert'));
    expect(getByText('TLS Cert')).toBeInTheDocument();
    expect(getByText('TLS Key')).toBeInTheDocument();
    expect(getByText('Admin Macaroon')).toBeInTheDocument();
    expect(filesMock.read).toBeCalledWith(expect.stringContaining('client.pem'), 'hex');
    expect(filesMock.read).toBeCalledWith(
      expect.stringContaining('client-key.pem'),
      'hex',
    );
    expect(filesMock.read).toBeCalledWith(
      expect.stringContaining('access.macaroon'),
      'hex',
    );
  });

  it('should handle all missing credentials', async () => {
    const missingCreds = {} as ConnectionInfo['credentials'];
    const { queryByText } = renderComponent(missingCreds, 'hex');
    await waitFor(() => null); // wait for useAsync to complete
    expect(queryByText('TLS Cert')).not.toBeInTheDocument();
    expect(queryByText('Admin Macaroon')).not.toBeInTheDocument();
    expect(queryByText('Read-only Macaroon')).not.toBeInTheDocument();
    expect(filesMock.read).not.toBeCalled();
  });
});
