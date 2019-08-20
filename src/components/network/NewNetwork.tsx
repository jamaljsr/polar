import React, { useEffect, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { info } from 'electron-log';
import { Form, Input, Button, notification } from 'antd';
import { FormComponentProps } from 'antd/lib/form';
import { useStoreActions } from 'store';

interface Props extends FormComponentProps {
  name?: string;
}

const NewNetwork: React.SFC<Props> = ({ form }) => {
  useEffect(() => info('Rendering NewNetwork component'), []);

  const { t } = useTranslation();
  const { addNetwork } = useStoreActions(s => s.network);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    form.validateFields((err, values) => {
      if (err) {
        return;
      }
      addNetwork(values.name).then(() => {
        notification.success({
          message:
            t('cmps.new-network.success-msg', 'Created network') + ': ' + values.name,
          placement: 'bottomRight',
          bottom: 50,
        });
      });
    });
  };

  return (
    <div>
      <h1>{t('cmps.new-network.title', 'Create a new Lightning Network')}</h1>
      <Form onSubmit={handleSubmit}>
        <Form.Item label={t('cmps.new-network.name-label', 'Network Name')}>
          {form.getFieldDecorator('name', {
            rules: [{ required: true }],
          })(
            <Input
              placeholder={t('cmps.new-network.name-phldr', 'My Lightning Simnet')}
              data-tid="name"
            />,
          )}
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" data-tid="submit">
            {t('cmps.new-network.btn-create', 'Create')}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Form.create<Props>()(NewNetwork);
