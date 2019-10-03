import React, { useCallback, useState } from 'react';
import { useAsync } from 'react-async-hook';
import { useTranslation } from 'react-i18next';
import { Alert, Col, Form, Input, Modal, Row } from 'antd';
import { FormComponentProps, FormProps } from 'antd/lib/form';
import { useStoreActions, useStoreState } from 'store';
import { Network } from 'types';
import { Loader } from 'components/common';
import LightningNodeSelect from 'components/common/form/LightningNodeSelect';

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
  const { getWalletBalance } = useStoreActions(s => s.lnd);
  const getBalancesAsync = useAsync(async () => {
    if (!visible) return;
    const { lightning } = network.nodes;
    for (const name in lightning) {
      await getWalletBalance(lightning[name]);
    }
  }, [network.nodes, visible]);

  const handleSubmit = () => {
    form.validateFields((err, values: FormProps) => {
      if (err) return;

      console.warn('form submitted', values);
      if (onClose) onClose();
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
      <Form.Item label={t('cmps.open-channel-modal.capacity-label', 'Capacity')}>
        {form.getFieldDecorator('capacity', {
          rules: [{ required: true, message: 'required' }],
        })(<Input placeholder="10.12345678" addonAfter="BTC" />)}
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
        onOk={handleSubmit}
      >
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
