import React, { useState } from 'react';
import { useAsync } from 'react-async-hook';
import { encode } from 'lndconnect';
import { useStoreActions } from 'store';
import { LndNode } from 'types';
import { read, readHex } from 'utils/files';
import { ellipseInner } from 'utils/strings';
import CopyIcon from 'components/common/CopyIcon';
import DetailsList, { DetailValues } from 'components/common/DetailsList';

interface Props {
  node: LndNode;
}

const LndConnect: React.FC<Props> = ({ node }) => {
  const { notify } = useStoreActions(s => s.app);
  const [connectUrl, setConnectUrl] = useState('');
  useAsync(async () => {
    const { tlsCert, adminMacaroon } = node.paths;
    try {
      const url = encode({
        host: `127.0.0.1:${node.ports.grpc}`,
        cert: await read(tlsCert),
        macaroon: await readHex(adminMacaroon),
      });
      setConnectUrl(url);
    } catch (error) {
      notify({ message: 'Unable to create LND Connect url', error });
    }
  }, [node.paths, node.status]);

  const details: DetailValues = [
    {
      label: 'LND Connect Url',
      value: (
        <CopyIcon
          label={'LND Connect Url'}
          value={connectUrl}
          text={ellipseInner(connectUrl, 34, 1)}
        />
      ),
    },
  ];

  return <DetailsList details={details} oneCol />;
};

export default LndConnect;
