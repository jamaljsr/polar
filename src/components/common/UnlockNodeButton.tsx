import React from 'react';
import { UnlockOutlined } from '@ant-design/icons';
import { Button, Form } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { LightningNode } from 'shared/types';
import { useStoreActions } from 'store';

interface Props {
  node: LightningNode;
  type?: 'button' | 'menu';
}

const UnlockNodeButton: React.FC<Props> = ({ node, type }) => {
  const { l } = usePrefixedTranslation('cmps.common.UnlockNodeButton');
  const { showUnlockNode } = useStoreActions(s => s.modals);
  const handleClick = () => {
    showUnlockNode({
      nodeName: node.name,
    });
  };

  // render a menu item inside of the NodeContextMenu
  if (type === 'menu') {
    return (
      <div onClick={handleClick}>
        <UnlockOutlined />
        <span>{l('menu')}</span>
      </div>
    );
  }

  return (
    <Form.Item label={l('title')} colon={false}>
      <Button icon={<UnlockOutlined />} block onClick={handleClick}>
        {l('btn')}
      </Button>
    </Form.Item>
  );
};

export default UnlockNodeButton;
