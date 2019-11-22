import React from 'react';
import { CLightningNode } from 'shared/types';

interface Props {
  node: CLightningNode;
}

const ConnectTab: React.FC<Props> = ({ node }) => {
  return <div>Connect {node.name}</div>;
};

export default ConnectTab;
