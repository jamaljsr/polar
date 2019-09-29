import React, { FormEvent, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { info } from 'electron-log';
import { Button, Card, Col, Form, Input, InputNumber, Row } from 'antd';
import { FormComponentProps } from 'antd/lib/form';
import { useStoreActions } from 'store';

interface FormProps {
  name: string;
  lndNodes: number;
  bitcoindNodes: number;
}

const NewNetwork: React.SFC<FormComponentProps> = ({ form }) => {
  useEffect(() => info('Rendering NewNetwork component'), []);

  const { t } = useTranslation();
  const { addNetwork } = useStoreActions(s => s.network);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    form.validateFields((err, values: FormProps) => {
      if (err) {
        return;
      }
      addNetwork(values);
    });
  };

  return (
    <Card title={t('cmps.new-network.title', 'Create a new Lightning Network')}>
      <Form onSubmit={handleSubmit} colon={false}>
        <Form.Item label={t('cmps.new-network.name-label', 'Network Name')}>
          {form.getFieldDecorator('name', {
            rules: [{ required: true, message: 'name is required' }],
          })(
            <Input
              placeholder={t('cmps.new-network.name-phldr', 'My Lightning Simnet')}
            />,
          )}
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={t('cmps.new-network.lnd-nodes-label', 'How many LND nodes?')}
            >
              {form.getFieldDecorator('lndNodes', {
                rules: [{ required: true, message: 'required' }],
                initialValue: 2,
              })(<InputNumber min={1} max={10} />)}
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t(
                'cmps.new-network.bitcoind-nodes-label',
                'How many bitcoind nodes?',
              )}
              help={t('cmps.new-network.bitcoind-nodes-soon', 'Coming Soon') + '...'}
            >
              {form.getFieldDecorator('bitcoindNodes', {
                rules: [{ required: true, message: 'required' }],
                initialValue: 1,
              })(<InputNumber min={1} max={10} disabled />)}
            </Form.Item>
          </Col>
        </Row>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            {t('cmps.new-network.btn-create', 'Create')}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default Form.create()(NewNetwork);
