import React, { useState } from 'react';
import { useAsync } from 'react-async-hook';
import { usePrefixedTranslation } from 'hooks';
import { useStoreActions } from 'store';
import { read } from 'utils/files';
import { ellipseInner } from 'utils/strings';
import CopyIcon from 'components/common/CopyIcon';
import DetailsList, { DetailValues } from 'components/common/DetailsList';
import { ConnectionInfo } from '../ConnectTab';

interface Props {
  encoding: 'hex' | 'base64';
  credentials: ConnectionInfo['credentials'];
}

const EncodedStrings: React.FC<Props> = ({ encoding, credentials }) => {
  const { l } = usePrefixedTranslation('cmps.designer.lightning.connect.EncodedStrings');
  const { notify } = useStoreActions(s => s.app);
  const [encodedValues, setEncodedValues] = useState<Record<string, string>>({});
  useAsync(async () => {
    const { cert, clientCert, clientKey, admin, invoice, readOnly, rune, lit, tap } =
      credentials;
    try {
      const values: Record<string, string> = {};
      if (cert) values[l('tlsCert')] = await read(cert, encoding);
      if (clientCert) values[l('tlsClientCert')] = await read(clientCert, encoding);
      if (clientKey) values[l('tlsClientKey')] = await read(clientKey, encoding);
      if (admin) values[l('adminMacaroon')] = await read(admin, encoding);
      if (invoice) values[l('invoiceMacaroon')] = await read(invoice, encoding);
      if (readOnly) values[l('readOnlyMacaroon')] = await read(readOnly, encoding);
      if (rune) {
        // runes are stored in base64, so we read it as plain text first then convert
        // to the desired encoding
        const value = await read(rune, 'utf-8');
        values[l('rune')] =
          encoding === 'base64' ? value : Buffer.from(value, 'base64').toString(encoding);
      }
      if (lit) values[l('litMacaroon')] = await read(lit, encoding);
      if (tap) values[l('tapMacaroon')] = await read(tap, encoding);
      setEncodedValues(values);
    } catch (error: any) {
      notify({ message: l('error'), error });
    }
  }, [credentials, encoding]);

  const auth: DetailValues = Object.entries(encodedValues).map(([label, val]) => {
    return {
      label: label,
      value: <CopyIcon label={label} value={val} text={ellipseInner(val, 14)} />,
    };
  });

  return <DetailsList details={auth} oneCol />;
};

export default EncodedStrings;
