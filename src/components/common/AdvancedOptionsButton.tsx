import React from 'react';
import { SettingOutlined } from '@ant-design/icons';
import { Button, Form } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { BitcoinNode, LightningNode } from 'shared/types';
import { useStoreActions } from 'store';
import { dockerConfigs } from 'utils/constants';

interface Props {
  node: LightningNode | BitcoinNode;
}

const AdvancedOptionsButton: React.FC<Props> = ({ node }) => {
  const { l } = usePrefixedTranslation('cmps.common.AdvancedOptionsButton');
  const { showAdvancedOptions } = useStoreActions(s => s.modals);

  return (
    <Form.Item label={l('title')} colon={false}>
      <Button
        icon={<SettingOutlined />}
        block
        onClick={() =>
          showAdvancedOptions({
            nodeName: node.name,
            command: node.docker.command,
            defaultCommand: dockerConfigs[node.implementation].command,
          })
        }
      >
        {l('btn')}
      </Button>
    </Form.Item>
  );
};

export default AdvancedOptionsButton;
