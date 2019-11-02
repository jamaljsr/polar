import React from 'react';
import { Button } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { LndNode, Status } from 'shared/types';
import { useStoreActions } from 'store';
import { TERMINAL } from 'components/routing';
import { Deposit, OpenChannelButtons } from './actions';

interface Props {
  node: LndNode;
}

const ActionsTab: React.FC<Props> = ({ node }) => {
  const { l } = usePrefixedTranslation('cmps.designer.lnd.ActionsTab');
  const { navigateTo } = useStoreActions(s => s.app);

  if (node.status !== Status.Started) {
    return <>{l('notStarted')}</>;
  }

  // TODO: use a helper for prefix
  const containerName = `polar-n${node.networkId}-${node.name}`;

  return (
    <>
      {node.status === Status.Started && (
        <>
          <Deposit node={node} />
          <OpenChannelButtons node={node} />
          <Button
            type="primary"
            block
            onClick={() => navigateTo(TERMINAL(node.implementation, containerName))}
          >
            Open Terminal
          </Button>
        </>
      )}
    </>
  );
};

export default ActionsTab;
