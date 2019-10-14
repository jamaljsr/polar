import React from 'react';
import { useAsync, useAsyncCallback } from 'react-async-hook';
import { useTranslation } from 'react-i18next';
import { Alert, Col, Form, InputNumber, Modal, Row } from 'antd';
import { FormComponentProps } from 'antd/lib/form';
import { useStoreActions, useStoreState } from 'store';
import { OpenChannelPayload } from 'store/models/lnd';
import { Network } from 'types';
import { Loader } from 'components/common';
import LightningNodeSelect from 'components/common/form/LightningNodeSelect';

interface FormFields {
  from: string;
  to: string;
  sats: string;
}

interface Props extends FormComponentProps<FormFields> {
  network: Network;
}

const OpenChannelModal: React.FC<Props> = ({ network, form }) => {
  const { t } = useTranslation();
  const { nodes } = useStoreState(s => s.lnd);
  const { visible, to, from } = useStoreState(s => s.modals.openChannel);
  const { hideOpenChannel } = useStoreActions(s => s.modals);
  const { getWalletBalance, openChannel } = useStoreActions(s => s.lnd);
  const getBalancesAsync = useAsync(async () => {
    if (!visible) return;
    const { lightning } = network.nodes;
    for (const name in lightning) {
      await getWalletBalance(lightning[name]);
    }
  }, [network.nodes, visible]);
  const openChanAsync = useAsyncCallback(async (payload: OpenChannelPayload) => {
    await openChannel(payload);
    hideOpenChannel();
  });

  const handleSubmit = () => {
    form.validateFields((err, values: FormFields) => {
      if (err) return;

      const { lightning } = network.nodes;
      const fromNode = lightning.find(n => n.name === values.from);
      const toNode = lightning.find(n => n.name === values.to);
      if (!fromNode || !toNode) return;
      openChanAsync.execute({ from: fromNode, to: toNode, sats: values.sats });
    });
  };

  let cmp = (
    <Form hideRequiredMark colon={false}>
      <Row type="flex" gutter={16}>
        <Col span={12}>
          <LightningNodeSelect
            network={network}
            id="from"
            form={form}
            label={t('cmps.open-channel-modal.source', 'Source')}
            initialValue={from}
            nodes={nodes}
          />
        </Col>
        <Col span={12}>
          <LightningNodeSelect
            network={network}
            id="to"
            form={form}
            label={t('cmps.open-channel-modal.dest', 'Destination')}
            initialValue={to}
            nodes={nodes}
          />
        </Col>
      </Row>
      <Form.Item
        label={t('cmps.open-channel-modal.capacity-label', 'Capacity (sats)')}
        help="Minimum: 20,000 sats - Maximum 16,777,216 sats"
      >
        {form.getFieldDecorator('sats', {
          initialValue: 20000,
          rules: [{ required: true, message: 'required' }],
        })(
          <InputNumber
            min={20000}
            formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={v => `${v}`.replace(/(undefined|,*)/g, '')}
            style={{ width: '100%' }}
          />,
        )}
      </Form.Item>
    </Form>
  );

  if (getBalancesAsync.loading) {
    cmp = <Loader />;
  } else if (getBalancesAsync.error) {
    cmp = (
      <Alert
        type="error"
        closable={false}
        message="Unable to fetch node balances"
        description={getBalancesAsync.error.message}
      />
    );
  }

  return (
    <>
      <Modal
        title="Open New Channel"
        visible={visible}
        onCancel={() => hideOpenChannel()}
        destroyOnClose
        okText={t('cmps.open-channel-modal.on-text', 'Open Channel')}
        okButtonProps={{ loading: openChanAsync.loading }}
        onOk={handleSubmit}
      >
        {openChanAsync.error && (
          <Alert
            type="error"
            message="Unable to open the channel"
            description={openChanAsync.error.message}
          />
        )}
        {cmp}
      </Modal>
    </>
  );
};

export default Form.create<Props>()(OpenChannelModal);
