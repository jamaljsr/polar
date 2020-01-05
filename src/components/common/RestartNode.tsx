import React from 'react';
import styled from '@emotion/styled';
import { PlayCircleOutlined, PoweroffOutlined } from '@ant-design/icons';
import { Form } from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.css';
import { Button, Modal } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { CommonNode, Status } from 'shared/types';
import { useStoreActions } from 'store';

const Styled = {
  Button: styled(Button)`
    width: 50%;
  `,
};

interface Props {
  node: CommonNode;
}

const RestartNode: React.FC<Props> = ({ node }) => {
  const { l } = usePrefixedTranslation(`cmps.common.RestartNode`);
  const { notify } = useStoreActions(s => s.app);
  const { toggleNode } = useStoreActions(s => s.network);

  const disabled = [Status.Starting, Status.Stopping].includes(node.status);
  const showStop = node.status === Status.Started;

  const showConfirmModal = (mode: string) => {
    const { name } = node;
    Modal.confirm({
      title: l(`${mode}ConfirmTitle`, { name }),
      okText: l(`confirmBtn`),
      okType: showStop ? 'danger' : 'primary',
      cancelText: l(`cancelBtn`),
      onOk: async () => {
        try {
          await toggleNode(node);
          notify({ message: l(`${mode}Success`, { name }) });
        } catch (error) {
          notify({ message: l(`${mode}Error`), error });
          throw error;
        }
      },
    });
  };

  return (
    <Form.Item label={l('title')} colon={false}>
      <Button.Group style={{ width: '100%' }}>
        <Styled.Button
          disabled={disabled || !showStop}
          onClick={() => showConfirmModal('stop')}
        >
          <PoweroffOutlined />
          {l('stopBtn')}
        </Styled.Button>
        <Styled.Button
          disabled={disabled || showStop}
          onClick={() => showConfirmModal('start')}
        >
          <PlayCircleOutlined />
          {l('startBtn')}
        </Styled.Button>
      </Button.Group>
    </Form.Item>
  );
};

export default RestartNode;
