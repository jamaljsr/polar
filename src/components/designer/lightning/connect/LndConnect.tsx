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
  const { l } = usePrefixedTranslation('cmps.designer.lightning.connect.LndConnect');
  const { notify } = useStoreActions(s => s.app);
  const [urls, setUrls] = useState<Record<string, string>>({});
  useAsync(async () => {
    const { tlsCert, adminMacaroon, invoiceMacaroon, readonlyMacaroon } = node.paths;
    try {
      const host = `127.0.0.1:${node.ports.grpc}`;
      const resthost = `127.0.0.1:${node.ports.rest}`;

      const cert = await read(tlsCert);
      const adminMac = await read(adminMacaroon, 'hex');
      const invoiceMac = await read(invoiceMacaroon, 'hex');
      const readonlyMac = await read(readonlyMacaroon, 'hex');

      const values: Record<string, string> = {};
      values[l('grpcadminUrl')] = encode({ host, cert, macaroon: adminMac });
      values[l('grpcinvoiceUrl')] = encode({ host, cert, macaroon: invoiceMac });
      values[l('grpcreadOnlyUrl')] = encode({ host, cert, macaroon: readonlyMac });
      values[l('restadminUrl')] = encode({ host: resthost, cert, macaroon: adminMac });
      values[l('restinvoiceUrl')] = encode({
        host: resthost,
        cert,
        macaroon: invoiceMac,
      });
      values[l('restreadOnlyUrl')] = encode({
        host: resthost,
        cert,
        macaroon: readonlyMac,
      });
      setUrls(values);
    } catch (error) {
      notify({ message: l('encodeError'), error });
    }
  }, [node.paths, node.status]);

  const details: DetailValues = Object.entries(urls).map(([label, val]) => {
    return {
      label: label,
      value: <CopyIcon label={label} value={val} text={ellipseInner(val, 34, 1)} />,
    };
  });

  return <DetailsList details={details} oneCol />;
};

export default LndConnect;
