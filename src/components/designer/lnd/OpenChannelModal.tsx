import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';
import { Col, Form, Input, Modal, Row, Select } from 'antd';
import { FormComponentProps, FormProps } from 'antd/lib/form';
import { Network } from 'types';

const Styled = {
  OpenChannelModal: styled.div``,
};

interface Props extends FormComponentProps {
  network: Network;
  from?: string;
  to?: string;
  visible?: boolean;
  onClose?: () => void;
}

const OpenChannelModal: React.FC<Props> = ({
  network,
  to,
  from,
  visible,
  onClose,
  form,
}) => {
  const { t } = useTranslation();

  const handleSubmit = () => {
    form.validateFields((err, values: FormProps) => {
      if (err) return;

      console.warn('form submitted', values);
      if (onClose) onClose();
    });
  };

  const { lightning } = network.nodes;
  return (
    <Styled.OpenChannelModal>
      <Modal
        title="Open Channel"
        visible={visible}
        onCancel={onClose}
        destroyOnClose
        okText={t('cmps.open-channel-modal.on-text', 'Open Channel')}
        onOk={handleSubmit}
      >
        <Form hideRequiredMark colon={false}>
          <Row type="flex" gutter={16}>
            <Col span={12}>
              <Form.Item label={t('cmps.open-channel-modal.source', 'Source')}>
                {form.getFieldDecorator('from', {
                  initialValue: from,
                  rules: [{ required: true, message: 'required' }],
                })(
                  <Select>
                    {lightning.map(node => (
                      <Select.Option key={node.id} value={node.id}>
                        {node.name}
                      </Select.Option>
                    ))}
                  </Select>,
                )}
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={t('cmps.open-channel-modal.dest', 'Destination')}>
                {form.getFieldDecorator('to', {
                  initialValue: to,
                  rules: [{ required: true, message: 'required' }],
                })(
                  <Select>
                    {lightning.map(node => (
                      <Select.Option key={node.id} value={node.id}>
                        {node.name}
                      </Select.Option>
                    ))}
                  </Select>,
                )}
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label={t('cmps.open-channel-modal.capacity-label', 'Capacity')}>
            {form.getFieldDecorator('amount', {
              rules: [{ required: true, message: 'amount is required' }],
            })(
              <Input
                placeholder={t('cmps.open-channel-modal.amount-phldr', '10.12345678')}
                addonAfter="BTC"
              />,
            )}
          </Form.Item>
        </Form>
      </Modal>
    </Styled.OpenChannelModal>
  );
};

export default Form.create<Props>()(OpenChannelModal);

export const useOpenChannelModal = (network: Network) => {
  const [visible, setVisible] = useState(false);
  const [from, setFrom] = useState<string>();
  const [to, setTo] = useState<string>();
  const show = useCallback((args: { to?: string; from?: string }) => {
    setTo(args.to);
    setFrom(args.from);
    setVisible(true);
  }, []);
  const onClose = useCallback(() => setVisible(false), []);

  return {
    network,
    show,
    visible,
    to,
    from,
    onClose,
  };
};
