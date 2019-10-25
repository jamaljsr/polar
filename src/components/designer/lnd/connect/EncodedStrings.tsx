import React, { useState } from 'react';
import { useAsync } from 'react-async-hook';
import { usePrefixedTranslation } from 'hooks';
import { useStoreActions } from 'store';
import { LndNode } from 'shared/types';
import { read } from 'utils/files';
import { ellipseInner } from 'utils/strings';
import CopyIcon from 'components/common/CopyIcon';
import DetailsList, { DetailValues } from 'components/common/DetailsList';

interface Props {
  encoding: 'hex' | 'base64';
  node: LndNode;
}

const EncodedStrings: React.FC<Props> = ({ encoding, node }) => {
  const { l } = usePrefixedTranslation('cmps.designer.lnd.connect.EncodedStrings');
  const { notify } = useStoreActions(s => s.app);
  const [encodedValues, setEncodedValues] = useState<Record<string, string>>({});
  useAsync(async () => {
    const { tlsCert, adminMacaroon, readonlyMacaroon } = node.paths;
    try {
      setEncodedValues({
        tlsCert: await read(tlsCert, encoding),
        adminMacaroon: await read(adminMacaroon, encoding),
        readonlyMacaroon: await read(readonlyMacaroon, encoding),
      });
    } catch (error) {
      notify({ message: l('error'), error });
    }
  }, [node.paths, node.status, encoding]);

  const { tlsCert, adminMacaroon: admin, readonlyMacaroon: readonly } = encodedValues;
  const auth: DetailValues = [
    [l('tlsCert'), tlsCert, ellipseInner(tlsCert, 14)],
    [l('adminMacaroon'), admin, ellipseInner(admin, 14)],
    [l('readOnlyMacaroon'), readonly, ellipseInner(readonly, 14)],
  ].map(([label, value, text]) => ({
    label,
    value: <CopyIcon label={label} value={value} text={text} />,
  }));

  return <DetailsList details={auth} oneCol />;
};

export default EncodedStrings;
