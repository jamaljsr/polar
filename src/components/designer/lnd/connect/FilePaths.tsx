import React from 'react';
import { usePrefixedTranslation } from 'hooks';
import { LndNode } from 'shared/types';
import { ellipseInner } from 'utils/strings';
import CopyIcon from 'components/common/CopyIcon';
import DetailsList, { DetailValues } from 'components/common/DetailsList';

interface Props {
  node: LndNode;
}

const FilePaths: React.FC<Props> = ({ node }) => {
  const { l } = usePrefixedTranslation('cmps.designer.lnd.connect.FilePaths');
  const { tlsCert, adminMacaroon: admin, readonlyMacaroon: read } = node.paths;

  const auth: DetailValues = [
    [l('tlsCert'), tlsCert, ellipseInner(tlsCert, 14, 22)],
    [l('adminMacaroon'), admin, ellipseInner(admin, 14, 22)],
    [l('readOnlyMacaroon'), read, ellipseInner(read, 14, 22)],
  ].map(([label, value, text]) => ({
    label,
    value: <CopyIcon label={label} value={value} text={text} />,
  }));

  return <DetailsList details={auth} oneCol />;
};

export default FilePaths;
