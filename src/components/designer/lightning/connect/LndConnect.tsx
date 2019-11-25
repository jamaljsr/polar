import React, { useState } from 'react';
import { useAsync } from 'react-async-hook';
import { usePrefixedTranslation } from 'hooks';
import { encode } from 'lndconnect';
import { LndNode } from 'shared/types';
import { useStoreActions } from 'store';
import { read } from 'utils/files';
import { ellipseInner } from 'utils/strings';
import CopyIcon from 'components/common/CopyIcon';
import DetailsList, { DetailValues } from 'components/common/DetailsList';

interface Props {
  node: LndNode;
}

const LndConnect: React.FC<Props> = ({ node }) => {
  const { l } = usePrefixedTranslation('cmps.designer.lnd.connect.LndConnect');
  const { notify } = useStoreActions(s => s.app);
  const [connectUrl, setConnectUrl] = useState('');
  useAsync(async () => {
    const { tlsCert, adminMacaroon } = node.paths;
    try {
      const url = encode({
        host: `127.0.0.1:${node.ports.grpc}`,
        cert: await read(tlsCert),
        macaroon: await read(adminMacaroon, 'hex'),
      });
      setConnectUrl(url);
    } catch (error) {
      notify({ message: l('encodeError'), error });
    }
  }, [node.paths, node.status]);

  const details: DetailValues = [
    {
      label: l('connectUrl'),
      value: (
        <CopyIcon
          label={l('connectUrl')}
          value={connectUrl}
          text={ellipseInner(connectUrl, 34, 1)}
        />
      ),
    },
  ];

  return <DetailsList details={details} oneCol />;
};

export default LndConnect;
