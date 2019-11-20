import React, { FormEvent, useEffect } from 'react';
import { info } from 'electron-log';
import styled from '@emotion/styled';
import { Button, Card, Col, Form, Input, InputNumber, PageHeader, Row } from 'antd';
import { FormComponentProps } from 'antd/lib/form';
import { usePrefixedTranslation } from 'hooks';
import { useStoreActions } from 'store';
import { HOME } from 'components/routing';

const Styled = {
  PageHeader: styled(PageHeader)`
    border: 1px solid rgb(235, 237, 240);
    background-color: #fff;
    margin-bottom: 10px;
    flex: 0;
  `,
};

interface FormProps {
  name: string;
  lndNodes: number;
  lightningdNodes: number;
  bitcoindNodes: number;
}

const NewNetwork: React.SFC<FormComponentProps> = ({ form }) => {
  useEffect(() => info('Rendering NewNetwork component'), []);

  const { l } = usePrefixedTranslation('cmps.network.NewNetwork');
  const { navigateTo } = useStoreActions(s => s.app);
  const { addNetwork } = useStoreActions(s => s.network);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    form.validateFields((err, values: FormProps) => {
      if (err) return;

      addNetwork(values);
    });
  };

  return (
    <>
      <Styled.PageHeader title={l('title')} onBack={() => navigateTo(HOME)} />
      <Card>
        <Form onSubmit={handleSubmit} colon={false}>
          <Form.Item label={l('nameLabel')}>
            {form.getFieldDecorator('name', {
              rules: [{ required: true, message: l('cmps.forms.required') }],
            })(<Input placeholder={l('namePhldr')} />)}
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label={l('lndNodesLabel')}>
                {form.getFieldDecorator('lndNodes', {
                  rules: [{ required: true, message: l('cmps.forms.required') }],
                  initialValue: 2,
                })(<InputNumber min={0} max={10} />)}
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={l('lightningdNodesLabel')}>
                {form.getFieldDecorator('lightningdNodes', {
                  rules: [{ required: true, message: l('cmps.forms.required') }],
                  initialValue: 1,
                })(<InputNumber min={0} max={10} />)}
              </Form.Item>
            </Col>
            <Col span={8}>
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
    </>
  );
};

export default Form.create()(NewNetwork);
