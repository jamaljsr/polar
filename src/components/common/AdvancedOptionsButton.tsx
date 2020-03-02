import React from 'react';
import { SettingOutlined } from '@ant-design/icons';
import { Button, Form } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { BitcoinNode, LightningNode } from 'shared/types';
import { useStoreActions } from 'store';
import { dockerConfigs } from 'utils/constants';

interface Props {
  node: LightningNode | BitcoinNode;
  type?: 'button' | 'menu';
}

const AdvancedOptionsButton: React.FC<Props> = ({ node, type }) => {
  const { l } = usePrefixedTranslation('cmps.common.AdvancedOptionsButton');
  const { showAdvancedOptions } = useStoreActions(s => s.modals);
  const handleClick = () => {
    showAdvancedOptions({
      nodeName: node.name,
      command: node.docker.command,
      defaultCommand: dockerConfigs[node.implementation].command,
    });
  };

  // render a menu item inside of the NodeContextMenu
  if (type === 'menu') {
    return (
      <span onClick={handleClick}>
        <SettingOutlined />
        <span>{l('menu')}</span>
      </span>
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
