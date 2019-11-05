import React from 'react';
import { usePrefixedTranslation } from 'hooks';
import { LndNode, Status } from 'shared/types';
import { OpenTerminalButton } from 'components/terminal';
import { Deposit, OpenChannelButtons, RemoveNode } from './actions';

interface Props {
  node: LndNode;
}

const ActionsTab: React.FC<Props> = ({ node }) => {
  const { l } = usePrefixedTranslation('cmps.designer.lnd.ActionsTab');

  return (
    <>
      {node.status !== Status.Started && l('notStarted')}
      {node.status === Status.Started && (
        <>
          <Deposit node={node} />
          <OpenChannelButtons node={node} />
          <OpenTerminalButton node={node} />
        </>
      )}
      <RemoveNode node={node} />
    </>
  );
};

export default ActionsTab;
