import React from 'react';
import { useAsyncCallback } from 'react-async-hook';
import styled from '@emotion/styled';
import { Button, Col, Form, Input, Modal, Row } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useStoreActions } from 'store';
import { ManagedNode } from 'types';
import { dockerConfigs } from 'utils/constants';
import { CommandVariables } from './';

const Styled = {
  Summary: styled.div`
    margin-bottom: 16px;
  `,
  ResetCol: styled(Col)`
    text-align: left;
  `,
};

interface Props {
  node: ManagedNode;
  onClose: () => void;
}

const ManagedNodeModal: React.FC<Props> = ({ node, onClose }) => {
  const { l } = usePrefixedTranslation('cmps.nodes.ManagedNodeModal');
  const [form] = Form.useForm();
  const { notify, updateManagedNode } = useStoreActions(s => s.app);

  const config = dockerConfigs[node.implementation];

  const saveAsync = useAsyncCallback(async (command: string) => {
    try {
      node.command = command;
      await updateManagedNode(node);
      onClose();
    } catch (error) {
      notify({ message: l('saveError'), error });
    }
  });
  const handleSubmit = (values: any) => saveAsync.execute(values.command);
  const handleReset = () => saveAsync.execute('');

  return (
    <Modal
      title={l('title', node)}
      visible
      width={600}
      destroyOnClose
      onCancel={onClose}
      maskClosable={false}
      footer={
        <Row>
          <Styled.ResetCol sm={12}>
            <Button onClick={handleReset}>{l('resetBtn')}</Button>
          </Styled.ResetCol>
          <Col sm={12}>
            <Button onClick={onClose}>{l('cancelBtn')}</Button>
            <Button onClick={form.submit} type="primary" loading={saveAsync.loading}>
              {l('okBtn')}
            </Button>
          </Col>
        </Row>
      }
    >
      <Form
        form={form}
        layout="vertical"
        hideRequiredMark
        colon={false}
        initialValues={{ command: node.command || config.command }}
        onFinish={handleSubmit}
      >
        <Styled.Summary>{l('summary')}</Styled.Summary>
        <Form.Item label={l('dockerImage')}>
          <Input value={`${config.imageName}:${node.version}`} disabled />
        </Form.Item>
        <Form.Item name="command" label={l('command')}>
          <Input.TextArea rows={6} disabled={saveAsync.loading} />
        </Form.Item>
        <CommandVariables implementation={node.implementation} />
      </Form>
    </Modal>
  );
};

export default ManagedNodeModal;
