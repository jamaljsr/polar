import React from 'react';
import { useAsyncCallback } from 'react-async-hook';
import styled from '@emotion/styled';
import { Button, Col, Form, Input, Modal, Row } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useStoreActions } from 'store';
import { ManagedImage } from 'types';
import { dockerConfigs } from 'utils/constants';
import { getDefaultCommand } from 'utils/network';
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
  image: ManagedImage;
  onClose: () => void;
}

const ManagedImageModal: React.FC<Props> = ({ image, onClose }) => {
  const { l } = usePrefixedTranslation('cmps.nodeImages.ManagedImageModal');
  const [form] = Form.useForm();
  const { notify, updateManagedImage } = useStoreActions(s => s.app);

  const config = dockerConfigs[image.implementation];

  const saveAsync = useAsyncCallback(async (command: string) => {
    try {
      image.command = command;
      await updateManagedImage(image);
      onClose();
    } catch (error: any) {
      notify({ message: l('saveError'), error });
    }
  });
  const handleSubmit = (values: any) => saveAsync.execute(values.command);
  const handleReset = () => saveAsync.execute('');

  return (
    <Modal
      title={l('title', image)}
      open
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
        initialValues={{
          command:
            image.command || getDefaultCommand(image.implementation, image.version),
        }}
        onFinish={handleSubmit}
      >
        <Styled.Summary>{l('summary')}</Styled.Summary>
        <Form.Item label={l('dockerImage')}>
          <Input value={`${config.imageName}:${image.version}`} disabled />
        </Form.Item>
        <Form.Item name="command" label={l('command')}>
          <Input.TextArea rows={6} disabled={saveAsync.loading} />
        </Form.Item>
        <CommandVariables implementation={image.implementation} />
      </Form>
    </Modal>
  );
};

export default ManagedImageModal;
