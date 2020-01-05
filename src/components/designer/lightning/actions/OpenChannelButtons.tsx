import React from 'react';
import styled from '@emotion/styled';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { Form } from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.css';
import { Button } from 'antd';
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
}

const OpenChannelButtons: React.FC<Props> = ({ node }) => {
  const { l } = usePrefixedTranslation(
    'cmps.designer.lightning.actions.OpenChannelButtons',
  );
  const { showOpenChannel } = useStoreActions(s => s.modals);

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
