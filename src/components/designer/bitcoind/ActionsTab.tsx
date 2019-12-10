import React from 'react';
import { BitcoinNode, Status } from 'shared/types';
import { OpenTerminalButton } from 'components/terminal';
import MineBlocksInput from './MineBlocksInput';

interface Props {
  node: BitcoinNode;
}

const ActionsTab: React.FC<Props> = ({ node }) => {
  return (
    <>
      {node.status === Status.Started && (
        <>
          <MineBlocksInput node={node} />
          <OpenTerminalButton node={node} />
        </>
      )}
    </>
  );
};

export default ActionsTab;
