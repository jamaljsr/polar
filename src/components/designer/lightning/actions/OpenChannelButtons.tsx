import React from 'react';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button, Form } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { LightningNode } from 'shared/types';
import { useStoreActions } from 'store';

const Styled = {
  Button: styled(Button)`
    width: 50%;
  `,
};

interface Props {
  node: LightningNode;
  menuType?: 'incoming' | 'outgoing';
}

const OpenChannelButtons: React.FC<Props> = ({ node, menuType }) => {
  const { l } = usePrefixedTranslation(
    'cmps.designer.lightning.actions.OpenChannelButtons',
  );
  const { showOpenChannel } = useStoreActions(s => s.modals);

  // render a menu item inside of the NodeContextMenu
  if (menuType) {
    const icon = menuType === 'incoming' ? <DownloadOutlined /> : <UploadOutlined />;
    const args = menuType === 'incoming' ? { to: node.name } : { from: node.name };
    return (
      <div onClick={() => showOpenChannel(args)}>
        {icon}
        <span>{l(`${menuType}Menu`)}</span>
      </div>
    );
  }

  return (
    <Form.Item label={l('openChannelTitle')} colon={false}>
      <Button.Group style={{ width: '100%' }}>
        <Styled.Button onClick={() => showOpenChannel({ to: node.name })}>
          <DownloadOutlined />
          {l('incoming')}
        </Styled.Button>
        <Styled.Button onClick={() => showOpenChannel({ from: node.name })}>
          <UploadOutlined />
          {l('outgoing')}
        </Styled.Button>
      </Button.Group>
    </Form.Item>
  );
};

export default OpenChannelButtons;
