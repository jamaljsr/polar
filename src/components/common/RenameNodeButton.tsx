import React from 'react';
import { FormOutlined } from '@ant-design/icons';
import { Button, Form } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { AnyNode } from 'shared/types';
import { useStoreActions } from 'store';

interface Props {
  node: AnyNode;
  type?: 'button' | 'menu';
}

const RenameNodeButton: React.FC<Props> = ({ node, type }) => {
  const { l } = usePrefixedTranslation('cmps.common.RenameNodeButton');
  const { showRenameNode } = useStoreActions(s => s.modals);
  const handleClick = () => {
    showRenameNode({
      oldNodeName: node.name,
    });
  };

  // render a menu item inside of the NodeContextMenu
  if (type === 'menu') {
    return (
      <div onClick={handleClick}>
        <FormOutlined />
        <span>{l('menu')}</span>
      </div>
    );
  }

  return (
    <Form.Item label={l('title')} colon={false}>
      <Button icon={<FormOutlined />} block onClick={handleClick}>
        {l('btn')}
      </Button>
    </Form.Item>
  );
};

export default RenameNodeButton;
