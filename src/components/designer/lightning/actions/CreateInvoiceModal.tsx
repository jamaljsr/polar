import React, { ReactNode } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import CopyToClipboard from 'react-copy-to-clipboard';
import { Button, Col, Form, InputNumber, message, Modal, Result, Row } from 'antd';
import { FormComponentProps } from 'antd/lib/form';
import { usePrefixedTranslation } from 'hooks';
import { LightningNode } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { Network } from 'types';
import { format } from 'utils/units';
import CopyableInput from 'components/common/form/CopyableInput';
import LightningNodeSelect from 'components/common/form/LightningNodeSelect';

interface FormFields {
  node?: string;
  amount?: string;
}

interface Props extends FormComponentProps<FormFields> {
  network: Network;
}

const CreateInvoiceModal: React.FC<Props> = ({ network, form }) => {
  const { l } = usePrefixedTranslation(
    'cmps.designer.lightning.actions.CreateInvoiceModal',
  );
  const { visible, nodeName, invoice, amount } = useStoreState(
    s => s.modals.createInvoice,
  );
  const { showCreateInvoice, hideCreateInvoice } = useStoreActions(s => s.modals);
  const { createInvoice } = useStoreActions(s => s.lightning);
  const { notify } = useStoreActions(s => s.app);

  const createAsync = useAsyncCallback(async (node: LightningNode, amount: number) => {
    try {
      const invoice = await createInvoice({ node, amount, memo: '' });
      showCreateInvoice({ nodeName: node.name, amount, invoice });
    } catch (error) {
      notify({ message: l('submitError'), error });
    }
  });

  const handleSubmit = () => {
    form.validateFields((err, values: FormFields) => {
      if (err) return;

      const { lightning } = network.nodes;
      const node = lightning.find(n => n.name === values.node);
      if (!node || !values.amount) return;
      createAsync.execute(node, parseInt(values.amount));
    });
  };

  const handleCopy = () => {
    message.success(l('copied'), 2);
    hideCreateInvoice();
  };

  let cmp: ReactNode;
  if (!invoice) {
    cmp = (
      <Form hideRequiredMark colon={false}>
        <Row type="flex" gutter={16}>
          <Col span={12}>
            <LightningNodeSelect
              network={network}
              id="node"
              form={form}
              label={l('nodeLabel')}
              disabled={createAsync.loading}
              initialValue={nodeName}
            />
          </Col>
          <Col span={12}>
            <Form.Item label={l('amountLabel') + ' (sats)'}>
              {form.getFieldDecorator('amount', {
                initialValue: 50000,
                rules: [{ required: true, message: l('cmps.forms.required') }],
              })(
                <InputNumber
                  min={1}
                  disabled={createAsync.loading}
                  formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={v => `${v}`.replace(/(undefined|,*)/g, '')}
                  style={{ width: '100%' }}
                />,
              )}
            </Form.Item>
          </Col>
        </Row>
      </Form>
    );
  } else {
    cmp = (
      <Result
        status="success"
        title={l('successTitle')}
        subTitle={l('successDesc', { nodeName, amount: format(`${amount}`) })}
        extra={
          <>
            <Form.Item>
              <CopyableInput label="Invoice" value={invoice} />
            </Form.Item>
            <Form.Item>
              <CopyToClipboard text={invoice} onCopy={handleCopy}>
                <Button type="primary">{l('copyClose')}</Button>
              </CopyToClipboard>
            </Form.Item>
          </>
        }
      />
    );
  }

  return (
    <>
      <Modal
        title={l('title')}
        visible={visible}
        onCancel={() => hideCreateInvoice()}
        destroyOnClose
        footer={invoice ? null : undefined}
        cancelText={l('cancelBtn')}
        okText={l('okBtn')}
        okButtonProps={{
          loading: createAsync.loading,
        }}
        onOk={handleSubmit}
      >
        {cmp}
      </Modal>
    </>
  );
};

export default Form.create<Props>()(CreateInvoiceModal);
