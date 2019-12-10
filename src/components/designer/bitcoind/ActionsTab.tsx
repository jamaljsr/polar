import React from 'react';
import { usePrefixedTranslation } from 'hooks';
import { BitcoinNode, Status } from 'shared/types';
import { OpenTerminalButton } from 'components/terminal';
import MineBlocksInput from './MineBlocksInput';

interface Props {
  node: BitcoinNode;
}

const ActionsTab: React.FC<Props> = ({ node }) => {
  const { l } = usePrefixedTranslation('cmps.designer.bitcoind.ActionsTab');

  if (node.status !== Status.Started) {
    return <>{l('notStarted')}</>;
  }

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
