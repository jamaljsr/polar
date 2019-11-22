import React from 'react';
import { LightningNode } from 'shared/types';

interface Props {
  node: LightningNode;
}

const ConnectTab: React.FC<Props> = ({ node }) => {
  return <div>Actions {node.name}</div>;
};

export default ConnectTab;
