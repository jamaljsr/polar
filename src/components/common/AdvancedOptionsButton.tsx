import React from 'react';
import { SettingOutlined } from '@ant-design/icons';
import { Button, Form } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { AnyNode } from 'shared/types';
import { useStoreActions } from 'store';
import { getDefaultCommand, getEffectiveCommand } from 'utils/network';

interface Props {
  node: AnyNode;
  type?: 'button' | 'menu';
}

const AdvancedOptionsButton: React.FC<Props> = ({ node, type }) => {
  const { l } = usePrefixedTranslation('cmps.common.AdvancedOptionsButton');
  const { showAdvancedOptions } = useStoreActions(s => s.modals);
  const handleClick = () => {
    showAdvancedOptions({
      nodeName: node.name,
      command: getEffectiveCommand(node),
      defaultCommand: getDefaultCommand(node.implementation, node.version),
    });
  };

  // render a menu item inside of the NodeContextMenu
  if (type === 'menu') {
    return (
      <div onClick={handleClick}>
        <SettingOutlined />
        <span>{l('menu')}</span>
      </div>
    );
  }

  return (
    <Form.Item label={l('title')} colon={false}>
      <Button icon={<SettingOutlined />} block onClick={handleClick}>
        {l('btn')}
      </Button>
    </Form.Item>
  );
};

export default AdvancedOptionsButton;
