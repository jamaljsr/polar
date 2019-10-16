import React from 'react';
import { LndNode } from 'types';
import { ellipseInner } from 'utils/strings';
import CopyIcon from 'components/common/CopyIcon';
import DetailsList, { DetailValues } from 'components/common/DetailsList';

interface Props {
  node: LndNode;
}

const FilePaths: React.FC<Props> = ({ node }) => {
  const { tlsCert, adminMacaroon: admin, readonlyMacaroon: read } = node.paths;
  const [left, right] = [14, 22];

  const auth: DetailValues = [
    ['TLS Cert', tlsCert, ellipseInner(tlsCert, left, right)],
    ['Admin Macaroon', admin, ellipseInner(admin, left, right)],
    ['Read-only Macaroon', read, ellipseInner(read, left, right)],
  ].map(([label, value, text]) => ({
    label,
    value: <CopyIcon label={label} value={value} text={text} />,
  }));

  return <DetailsList details={auth} oneCol />;
};

export default FilePaths;
