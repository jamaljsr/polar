import React from 'react';
import { usePrefixedTranslation } from 'hooks';
import { LndNode, Status } from 'shared/types';
import { OpenTerminalButton } from 'components/common';
import { Deposit, OpenChannelButtons } from './actions';

interface Props {
  node: LndNode;
}

const ActionsTab: React.FC<Props> = ({ node }) => {
  const { l } = usePrefixedTranslation('cmps.designer.lnd.ActionsTab');

  if (node.status !== Status.Started) {
    return <>{l('notStarted')}</>;
  }

  return (
    <>
      <Deposit node={node} />
      <OpenChannelButtons node={node} />
      <OpenTerminalButton node={node} />
    </>
  );
};

export default ActionsTab;
