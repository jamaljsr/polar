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
  const { l } = usePrefixedTranslation('cmps.designer.lnd.connect.FilePaths');
  const { cert, admin, readOnly } = credentials;

  const auth: DetailValues = [
    [l('tlsCert'), cert, cert && ellipseInner(cert, 14, 22)],
    [l('adminMacaroon'), admin, ellipseInner(admin, 14, 22)],
    [l('readOnlyMacaroon'), readOnly, readOnly && ellipseInner(readOnly, 14, 22)],
  ]
    .filter(c => !!c[1]) // exclude empty values
    .map(([label, value, text]) => ({
      label,
      value: <CopyIcon label={label} value={value as string} text={text} />,
    }));

  return <DetailsList details={auth} oneCol />;
};

export default FilePaths;
