import React from 'react';
import { Button, Form } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { BitcoinNode, LndNode } from 'shared/types';
import { useStoreActions } from 'store';
import { getContainerName } from 'utils/network';
import { TERMINAL } from 'components/routing';

interface Props {
  node: LndNode | BitcoinNode;
}

const OpenTerminalButton: React.FC<Props> = ({ node }) => {
  const { l } = usePrefixedTranslation('cmps.common.OpenTerminalButton');
  const { openWindow } = useStoreActions(s => s.app);

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
        onClick={() => openWindow(TERMINAL(node.implementation, getContainerName(node)))}
      >
        {l('btn')}
      </Button>
    </Form.Item>
  );
};

export default OpenTerminalButton;
