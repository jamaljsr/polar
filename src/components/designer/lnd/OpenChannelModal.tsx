import React, { useCallback, useState } from 'react';
import { useAsync, useAsyncCallback } from 'react-async-hook';
import { useTranslation } from 'react-i18next';
import { Alert, Col, Form, Input, Modal, Row } from 'antd';
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

interface Props extends FormComponentProps {
  network: Network;
  from?: string;
  to?: string;
  visible?: boolean;
  onClose?: () => void;
}

const OpenChannelModal: React.FC<Props> = ({
  network,
  to,
  from,
  visible,
  onClose,
  form,
}) => {
  const { t } = useTranslation();
  const { nodes } = useStoreState(s => s.lnd);
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
    if (onClose) onClose();
  });

  const handleSubmit = () => {
    form.validateFields((err, values: FormFields) => {
      if (err) return;

      console.warn('form submitted', values);
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
        label={t('cmps.open-channel-modal.capacity-label', 'Capacity')}
        help="Minimum: 20,000 sats - Maximum 16,777,216 sats"
      >
        {form.getFieldDecorator('sats', {
          rules: [{ required: true, message: 'required' }],
        })(<Input placeholder="100000" addonAfter="sats" />)}
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
        message="Unable to connect to node"
        description={getBalancesAsync.error.message}
      />
    );
  }

  return (
    <>
      <Modal
        title="Open Channel"
        visible={visible}
        onCancel={onClose}
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

export const useOpenChannelModal = (network: Network) => {
  const [visible, setVisible] = useState(false);
  const [from, setFrom] = useState<string>();
  const [to, setTo] = useState<string>();
  const show = useCallback((args: { to?: string; from?: string }) => {
    setTo(args.to);
    setFrom(args.from);
    setVisible(true);
  }, []);
  const onClose = useCallback(() => setVisible(false), []);

  return {
    network,
    show,
    visible,
    to,
    from,
    onClose,
  };
};
