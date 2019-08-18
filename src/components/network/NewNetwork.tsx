import React, { useEffect, FormEvent } from 'react';
import { info } from 'electron-log';
import { Form, Input, Button, notification } from 'antd';
import { FormComponentProps } from 'antd/lib/form';
import { useStoreActions } from 'store';

interface Props extends FormComponentProps {
  name?: string;
}

const NewNetwork: React.SFC<Props> = ({ form }) => {
  useEffect(() => info('Rendering NewNetwork component'), []);

  const { addNetwork } = useStoreActions(s => s.network);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    form.validateFields((err, values) => {
      if (!err) {
        addNetwork(values.name).then(() => {
          notification.success({
            message: (
              <>
                Created <b>{values.name}</b> network successfuly
              </>
            ),
            top: 48,
          });
        });
      }
    });
  };

  return (
    <div>
      <h1>Create a new Lightning Network</h1>
      <Form onSubmit={handleSubmit}>
        <Form.Item label="Network Name">
          {form.getFieldDecorator('name', {
            rules: [{ required: true }],
          })(<Input placeholder="My Lightning Simnet" data-tid="name" />)}
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" data-tid="submit">
            Create
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Form.create<Props>()(NewNetwork);
