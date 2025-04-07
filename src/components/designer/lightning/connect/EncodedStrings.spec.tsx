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
    expect(filesMock.read).toHaveBeenCalledWith(
      expect.stringContaining('tls.cert'),
      'hex',
    );
    expect(filesMock.read).toHaveBeenCalledWith(
      expect.stringContaining('admin.macaroon'),
      'hex',
    );
    expect(filesMock.read).toHaveBeenCalledWith(
      expect.stringContaining('readonly.macaroon'),
      'hex',
    );
  });

  it('should display credentials for Core Lightning', async () => {
    const cln = network.nodes.lightning[1] as CLightningNode;
    const clnCreds: ConnectionInfo['credentials'] = {
      rune: cln.paths.rune,
      cert: cln.paths.tlsCert,
      clientCert: cln.paths.tlsClientCert,
      clientKey: cln.paths.tlsClientKey,
    };
    const { getByText } = renderComponent(clnCreds, 'hex');
    await waitFor(() => getByText('TLS Cert'));
    expect(getByText('TLS Cert')).toBeInTheDocument();
    expect(getByText('TLS Client Cert')).toBeInTheDocument();
    expect(getByText('TLS Client Key')).toBeInTheDocument();
    expect(getByText('Admin Rune')).toBeInTheDocument();
    expect(filesMock.read).toHaveBeenCalledWith(expect.stringContaining('ca.pem'), 'hex');
    expect(filesMock.read).toHaveBeenCalledWith(
      expect.stringContaining('client.pem'),
      'hex',
    );
    expect(filesMock.read).toHaveBeenCalledWith(
      expect.stringContaining('client-key.pem'),
      'hex',
    );
    expect(filesMock.read).toHaveBeenCalledWith(
      expect.stringContaining('admin.rune'),
      'utf-8',
    );
  });

  it('should display base64 credentials for Core Lightning', async () => {
    const cln = network.nodes.lightning[1] as CLightningNode;
    const clnCreds: ConnectionInfo['credentials'] = {
      rune: cln.paths.rune,
      cert: cln.paths.tlsCert,
      clientCert: cln.paths.tlsClientCert,
      clientKey: cln.paths.tlsClientKey,
    };
    const { getByText } = renderComponent(clnCreds, 'base64');
    await waitFor(() => getByText('TLS Cert'));
    expect(getByText('TLS Cert')).toBeInTheDocument();
    expect(getByText('TLS Client Cert')).toBeInTheDocument();
    expect(getByText('TLS Client Key')).toBeInTheDocument();
    expect(getByText('Admin Rune')).toBeInTheDocument();
    expect(filesMock.read).toHaveBeenCalledWith(
      expect.stringContaining('ca.pem'),
      'base64',
    );
    expect(filesMock.read).toHaveBeenCalledWith(
      expect.stringContaining('client.pem'),
      'base64',
    );
    expect(filesMock.read).toHaveBeenCalledWith(
      expect.stringContaining('client-key.pem'),
      'base64',
    );
    expect(filesMock.read).toHaveBeenCalledWith(
      expect.stringContaining('admin.rune'),
      'utf-8',
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
