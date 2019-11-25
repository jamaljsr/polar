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
  const { l } = usePrefixedTranslation('cmps.designer.lnd.connect.EncodedStrings');
  const { notify } = useStoreActions(s => s.app);
  const [encodedValues, setEncodedValues] = useState<Record<string, string>>({});
  useAsync(async () => {
    const { cert, admin, readOnly } = credentials;
    try {
      const values: Record<string, string> = {};
      if (cert) values[l('tlsCert')] = await read(cert, encoding);
      if (admin) values[l('adminMacaroon')] = await read(admin, encoding);
      if (readOnly) values[l('readOnlyMacaroon')] = await read(readOnly, encoding);
      setEncodedValues(values);
    } catch (error) {
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
