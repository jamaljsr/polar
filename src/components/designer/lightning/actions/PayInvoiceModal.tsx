import React from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { Form, Input, Modal } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { LightningNode } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { Network } from 'types';
import { format } from 'utils/units';
import LightningNodeSelect from 'components/common/form/LightningNodeSelect';

interface Props {
  network: Network;
}

const PayInvoiceModal: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation('cmps.designer.lightning.actions.PayInvoiceModal');
  const [form] = Form.useForm();
  const { visible, nodeName } = useStoreState(s => s.modals.payInvoice);
  const { hidePayInvoice } = useStoreActions(s => s.modals);
  const { payInvoice } = useStoreActions(s => s.lightning);
  const { notify } = useStoreActions(s => s.app);

  const payAsync = useAsyncCallback(async (node: LightningNode, invoice: string) => {
    try {
      const { amount } = await payInvoice({ node, invoice });
      const nodeName = node.name;
      notify({
        message: l('successTitle'),
        description: l('successDesc', { amount: format(amount), nodeName }),
      });
      await hidePayInvoice();
    } catch (error: any) {
      notify({ message: l('submitError'), error });
    }
  });

  const handleSubmit = (values: any) => {
    const { lightning } = network.nodes;
    const node = lightning.find(n => n.name === values.node);
    if (!node || !values.invoice) return;
    payAsync.execute(node, values.invoice);
  };

  return (
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
      onOk={form.submit}
    >
      <Form
        form={form}
        layout="vertical"
        hideRequiredMark
        colon={false}
        initialValues={{ node: nodeName }}
        onFinish={handleSubmit}
      >
        <LightningNodeSelect
          network={network}
          name="node"
          label={l('nodeLabel')}
          disabled={payAsync.loading}
        />
        <Form.Item
          name="invoice"
          label={l('invoiceLabel')}
          rules={[{ required: true, message: l('cmps.forms.required') }]}
        >
          <Input.TextArea rows={6} disabled={payAsync.loading} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PayInvoiceModal;
