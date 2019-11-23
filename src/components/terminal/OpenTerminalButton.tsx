import React from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { Button, Form } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { BitcoinNode, LightningNode } from 'shared/types';
import { useStoreActions } from 'store';
import { getContainerName } from 'utils/network';
import { TERMINAL } from 'components/routing';

interface Props {
  node: LightningNode | BitcoinNode;
}

const OpenTerminalButton: React.FC<Props> = ({ node }) => {
  const { l } = usePrefixedTranslation('cmps.common.OpenTerminalButton');
  const { openWindow } = useStoreActions(s => s.app);
  const openAsync = useAsyncCallback(openWindow);

  let cmd = '';
  switch (node.implementation) {
    case 'LND':
      cmd = 'lncli';
      break;
    case 'bitcoind':
      cmd = 'bitcoin-cli';
      break;
  }
  return (
    <Form.Item label={l('title')} help={l('info', { cmd })}>
      <Button
        type="primary"
        icon="code"
        block
        loading={openAsync.loading}
        onClick={() =>
          openAsync.execute(TERMINAL(node.implementation, getContainerName(node)))
        }
      >
        {l('btn')}
      </Button>
    </Form.Item>
  );
};

export default OpenTerminalButton;
