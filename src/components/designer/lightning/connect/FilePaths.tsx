import React from 'react';
import { usePrefixedTranslation } from 'hooks';
import { ellipseInner } from 'utils/strings';
import CopyIcon from 'components/common/CopyIcon';
import DetailsList, { DetailValues } from 'components/common/DetailsList';
import { ConnectionInfo } from '../ConnectTab';

interface Props {
  credentials: ConnectionInfo['credentials'];
}

const FilePaths: React.FC<Props> = ({ credentials }) => {
  const { l } = usePrefixedTranslation('cmps.designer.lightning.connect.FilePaths');
  const { cert, clientCert, clientKey, admin, invoice, readOnly, rune, lit, tap } =
    credentials;

  const auth: DetailValues = [
    [l('tlsCert'), cert, cert && ellipseInner(cert, 14, 22)],
    [l('tlsClientCert'), clientCert, clientCert && ellipseInner(clientCert, 14, 22)],
    [l('tlsClientKey'), clientKey, clientKey && ellipseInner(clientKey, 14, 22)],
    [l('adminMacaroon'), admin, admin && ellipseInner(admin, 14, 22)],
    [l('invoiceMacaroon'), invoice, invoice && ellipseInner(invoice, 14, 22)],
    [l('readOnlyMacaroon'), readOnly, readOnly && ellipseInner(readOnly, 14, 22)],
    [l('rune'), rune, rune && ellipseInner(rune, 14, 22)],
    [l('litMacaroon'), lit, lit && ellipseInner(lit, 14, 22)],
    [l('tapMacaroon'), tap, tap && ellipseInner(tap, 14, 22)],
  ]
    .filter(c => !!c[1]) // exclude empty values
    .map(([label, value, text]) => ({
      label,
      value: <CopyIcon label={label} value={value as string} text={text} />,
    }));

  return <DetailsList details={auth} oneCol />;
};

export default FilePaths;
