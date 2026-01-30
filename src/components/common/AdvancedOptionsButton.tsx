import React from 'react';
import { SettingOutlined } from '@ant-design/icons';
import { Button, Form } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { AnyNode, LightningNode } from 'shared/types';
import { useStoreActions } from 'store';
import { getDefaultCommand } from 'utils/network';

interface Props {
  node: AnyNode;
  type?: 'button' | 'menu';
}

const AdvancedOptionsButton: React.FC<Props> = ({ node, type }) => {
  const { l } = usePrefixedTranslation('cmps.common.AdvancedOptionsButton');
  const { showAdvancedOptions } = useStoreActions(s => s.modals);
  const { getBackendNode } = useStoreActions(s => s.network);
  const handleClick = async () => {
    // the default command of a lightning node depends on the implementation of the
    // bitcoin backend it is connected to, so it must be looked up on the network
    const backend =
      node.type === 'lightning'
        ? (await getBackendNode(node as LightningNode))?.implementation
        : undefined;
    showAdvancedOptions({
      nodeName: node.name,
      command: node.docker.command,
      defaultCommand: getDefaultCommand(node.implementation, node.version, backend),
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
