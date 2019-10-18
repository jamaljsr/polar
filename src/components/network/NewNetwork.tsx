import React, { FormEvent, useEffect } from 'react';
import { info } from 'electron-log';
import { Button, Card, Col, Form, Input, InputNumber, Row } from 'antd';
import { FormComponentProps } from 'antd/lib/form';
import { usePrefixedTranslation } from 'hooks';
import { useStoreActions } from 'store';

interface FormProps {
  name: string;
  lndNodes: number;
  bitcoindNodes: number;
}

const NewNetwork: React.SFC<FormComponentProps> = ({ form }) => {
  useEffect(() => info('Rendering NewNetwork component'), []);

  const { l } = usePrefixedTranslation('cmps.network.NewNetwork');
  const { addNetwork } = useStoreActions(s => s.network);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    form.validateFields((err, values: FormProps) => {
      if (err) return;

      addNetwork(values);
    });
  };

  return (
    <Card title={l('title')}>
      <Form onSubmit={handleSubmit} colon={false}>
        <Form.Item label={l('nameLabel')}>
          {form.getFieldDecorator('name', {
            rules: [{ required: true, message: l('cmps.forms.required') }],
          })(<Input placeholder={l('namePhldr')} />)}
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label={l('lndNodesLabel')}>
              {form.getFieldDecorator('lndNodes', {
                rules: [{ required: true, message: l('cmps.forms.required') }],
                initialValue: 2,
              })(<InputNumber min={1} max={10} />)}
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={l('bitcoindNodesLabel')}
              help={l('bitcoindNodesSoon') + '...'}
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
            {l('btnCreate')}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default Form.create()(NewNetwork);
