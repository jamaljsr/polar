import React from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { Form } from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.css';
import { Input, Modal } from 'antd';
import { FormComponentProps } from 'antd/lib/form';
import { usePrefixedTranslation } from 'hooks';
import { LightningNode } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { Network } from 'types';
import { format } from 'utils/units';
import LightningNodeSelect from 'components/common/form/LightningNodeSelect';

interface FormFields {
  node?: string;
  invoice?: string;
}

interface Props extends FormComponentProps<FormFields> {
  network: Network;
}

const PayInvoiceModal: React.FC<Props> = ({ network, form }) => {
  const { l } = usePrefixedTranslation('cmps.designer.lightning.actions.PayInvoiceModal');
  const { visible, nodeName } = useStoreState(s => s.modals.payInvoice);
  const { hidePayInvoice } = useStoreActions(s => s.modals);
  const { payInvoice } = useStoreActions(s => s.lightning);
  const { notify } = useStoreActions(s => s.app);

  const payAsync = useAsyncCallback(async (node: LightningNode, invoice: string) => {
    try {
      const { amount } = await payInvoice({ node, invoice });
      const nodeName = form.getFieldsValue().node;
      notify({
        message: l('successTitle'),
        description: l('successDesc', { amount: format(amount), nodeName }),
      });
      hidePayInvoice();
    } catch (error) {
      notify({ message: l('submitError'), error });
    }
  });

  const handleSubmit = () => {
    form.validateFields((err, values: FormFields) => {
      if (err) return;

      const { lightning } = network.nodes;
      const node = lightning.find(n => n.name === values.node);
      if (!node || !values.invoice) return;
      payAsync.execute(node, values.invoice);
    });
  };

  return (
    <>
      <Modal
        title={l('title')}
        visible={visible}
        onCancel={() => hidePayInvoice()}
        destroyOnClose
        cancelText={l('cancelBtn')}
        okText={l('okBtn')}
        okButtonProps={{
          loading: payAsync.loading,
        }}
        onOk={handleSubmit}
      >
        <Form hideRequiredMark colon={false}>
          <LightningNodeSelect
            network={network}
            id="node"
            form={form}
            label={l('nodeLabel')}
            disabled={payAsync.loading}
            initialValue={nodeName}
          />
          <Form.Item label={l('invoiceLabel')}>
            {form.getFieldDecorator('invoice', {
              rules: [{ required: true, message: l('cmps.forms.required') }],
            })(<Input.TextArea rows={6} disabled={payAsync.loading} />)}
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Form.create<Props>()(PayInvoiceModal);
