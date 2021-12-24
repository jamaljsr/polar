import React, { ReactNode } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import CopyToClipboard from 'react-copy-to-clipboard';
import { Button, Col, Form, InputNumber, message, Modal, Result, Row } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { LightningNode } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { Network } from 'types';
import { format } from 'utils/units';
import CopyableInput from 'components/common/form/CopyableInput';
import LightningNodeSelect from 'components/common/form/LightningNodeSelect';

interface Props {
  network: Network;
}

const CreateInvoiceModal: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation(
    'cmps.designer.lightning.actions.CreateInvoiceModal',
  );
  const [form] = Form.useForm();
  const { visible, nodeName, invoice, amount } = useStoreState(
    s => s.modals.createInvoice,
  );
  const { showCreateInvoice, hideCreateInvoice } = useStoreActions(s => s.modals);
  const { createInvoice } = useStoreActions(s => s.lightning);
  const { notify } = useStoreActions(s => s.app);

  const createAsync = useAsyncCallback(async (node: LightningNode, amount: number) => {
    try {
      const invoice = await createInvoice({ node, amount, memo: '' });
      await showCreateInvoice({ nodeName: node.name, amount, invoice });
    } catch (error: any) {
      notify({ message: l('submitError'), error });
    }
  });

  const handleSubmit = (values: any) => {
    const { lightning } = network.nodes;
    const node = lightning.find(n => n.name === values.node);
    if (!node || !values.amount) return;
    createAsync.execute(node, parseInt(values.amount));
  };

  const handleCopy = () => {
    message.success(l('copied'), 2);
    hideCreateInvoice();
  };

  let cmp: ReactNode;
  if (!invoice) {
    cmp = (
      <Form
        form={form}
        layout="vertical"
        hideRequiredMark
        colon={false}
        initialValues={{ node: nodeName, amount: 50000 }}
        onFinish={handleSubmit}
      >
        <Row gutter={16}>
          <Col span={12}>
            <LightningNodeSelect
              network={network}
              name="node"
              label={l('nodeLabel')}
              disabled={createAsync.loading}
            />
          </Col>
          <Col span={12}>
            <Form.Item
              name="amount"
              label={l('amountLabel') + ' (sats)'}
              rules={[{ required: true, message: l('cmps.forms.required') }]}
            >
              <InputNumber<number>
                min={1}
                disabled={createAsync.loading}
                formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={v => parseInt(`${v}`.replace(/(undefined|,*)/g, ''))}
                style={{ width: '100%' }}
              />
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
          <Form>
            <Form.Item>
              <CopyableInput label="Invoice" value={invoice} />
            </Form.Item>
            <Form.Item>
              <CopyToClipboard text={invoice} onCopy={handleCopy}>
                <Button type="primary">{l('copyClose')}</Button>
              </CopyToClipboard>
            </Form.Item>
          </Form>
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
        onOk={form.submit}
      >
        {cmp}
      </Modal>
    </>
  );
};

export default CreateInvoiceModal;
