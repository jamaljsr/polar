import React, { useState } from 'react';
import { useAsync } from 'react-async-hook';
import { useStoreActions } from 'store';
import { LndNode } from 'types';
import { readHex } from 'utils/files';
import { ellipseInner } from 'utils/strings';
import CopyIcon from 'components/common/CopyIcon';
import DetailsList, { DetailValues } from 'components/common/DetailsList';

interface Props {
  node: LndNode;
}

const HexStrings: React.FC<Props> = ({ node }) => {
  const { notify } = useStoreActions(s => s.app);
  const [hexValues, setHexValues] = useState<Record<string, string>>({});
  useAsync(async () => {
    const { tlsCert, adminMacaroon, readonlyMacaroon } = node.paths;
    try {
      setHexValues({
        tlsCert: await readHex(tlsCert),
        adminMacaroon: await readHex(adminMacaroon),
        readonlyMacaroon: await readHex(readonlyMacaroon),
      });
    } catch (error) {
      notify({ message: 'Failed to hex encode file contents', error });
    }
  }, [node.paths, node.status]);

  const { tlsCert, adminMacaroon: admin, readonlyMacaroon: read } = hexValues;
  const auth: DetailValues = [
    ['TLS Cert', tlsCert, ellipseInner(tlsCert, 14)],
    ['Admin Macaroon', admin, ellipseInner(admin, 14)],
    ['Read-only Macaroon', read, ellipseInner(read, 14)],
  ].map(([label, value, text]) => ({
    label,
    value: <CopyIcon label={label} value={value} text={text} />,
  }));

  return <DetailsList details={auth} oneCol />;
};

export default HexStrings;
