import React, { useMemo, useState } from 'react';
import { useAsync, useAsyncCallback } from 'react-async-hook';
import { Alert, Checkbox, Col, Form, InputNumber, Modal, Row } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { Status } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { OpenChannelPayload } from 'store/models/lightning';
import { Network } from 'types';
import { Loader } from 'components/common';
import LightningNodeSelect from 'components/common/form/LightningNodeSelect';

interface Props {
  network: Network;
}

const OpenChannelModal: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation(
    'cmps.designer.lightning.actions.OpenChannelModal',
  );
  const [form] = Form.useForm();
  const [showDeposit, setShowDeposit] = useState(false);
  const { nodes } = useStoreState(s => s.lightning);
  const { visible, to, from } = useStoreState(s => s.modals.openChannel);
  const [selectedFrom, setSelectedFrom] = useState(from);
  const [selectedTo, setSelectedTo] = useState(to);
  const [selectedSats, setSelectedSats] = useState(250000);
  const { hideOpenChannel } = useStoreActions(s => s.modals);
  const { getWalletBalance, openChannel } = useStoreActions(s => s.lightning);
  const { notify } = useStoreActions(s => s.app);

  const getBalancesAsync = useAsync(async () => {
    if (!visible) return;
    const nodes = network.nodes.lightning.filter(n => n.status === Status.Started);
    for (const node of nodes) {
      await getWalletBalance(node);
    }
  }, [network.nodes, visible]);

  const openChanAsync = useAsyncCallback(async (payload: OpenChannelPayload) => {
    try {
      await openChannel(payload);
      hideOpenChannel();
    } catch (error: any) {
      notify({ message: l('submitError'), error });
    }
  });

  const sameNode = selectedFrom === selectedTo;
  useMemo(() => {
    if (
      selectedFrom &&
      nodes[selectedFrom] &&
      nodes[selectedFrom].walletBalance &&
      !openChanAsync.loading
    ) {
      const nodeInfo = nodes[selectedFrom];
      const confirmed = nodeInfo.walletBalance && nodeInfo.walletBalance.confirmed;
      const balance = parseInt(confirmed || '0');
      setShowDeposit(balance <= selectedSats && !sameNode);
    }
  }, [selectedFrom, selectedSats, nodes, sameNode, openChanAsync.loading]);

  const handleSubmit = (values: {
    isPrivate: boolean;
    autoFund: boolean;
    to: string;
    from: string;
    sats: string;
  }) => {
    const { lightning } = network.nodes;
    const fromNode = lightning.find(n => n.name === values.from);
    const toNode = lightning.find(n => n.name === values.to);
    if (!fromNode || !toNode) return;
    const autoFund = showDeposit && values.autoFund;
    openChanAsync.execute({
      from: fromNode,
      to: toNode,
      sats: values.sats,
      autoFund,
      isPrivate: values.isPrivate,
    });
  };

  let cmp = (
    <Form
      form={form}
      layout="vertical"
      hideRequiredMark
      colon={false}
      initialValues={{ from, to, sats: 250000, autoFund: true, isPrivate: false }}
      onFinish={handleSubmit}
    >
      {sameNode && <Alert type="error" message={l('sameNodesWarnMsg')} />}
      <Row gutter={16}>
        <Col span={12}>
          <LightningNodeSelect
            network={network}
            name="from"
            label={l('source')}
            disabled={openChanAsync.loading}
            nodeStatus={Status.Started}
            initialValue={from}
            onChange={v => setSelectedFrom(v?.toString())}
            nodes={nodes}
          />
        </Col>
        <Col span={12}>
          <LightningNodeSelect
            network={network}
            name="to"
            label={l('dest')}
            disabled={openChanAsync.loading}
            nodeStatus={Status.Started}
            initialValue={to}
            onChange={v => setSelectedTo(v?.toString())}
            nodes={nodes}
          />
        </Col>
      </Row>
      <Form.Item
        name="sats"
        label={l('capacityLabel') + ' (sats)'}
        rules={[{ required: true, message: l('cmps.forms.required') }]}
      >
        <InputNumber<number>
          disabled={openChanAsync.loading}
          formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={v => parseInt(`${v}`.replace(/(undefined|,*)/g, ''))}
          style={{ width: '100%' }}
          onChange={v => setSelectedSats(v as number)}
        />
      </Form.Item>
      {showDeposit && (
        <Form.Item name="autoFund" valuePropName="checked">
          <Checkbox disabled={openChanAsync.loading}>
            {l('deposit', { selectedFrom })}
          </Checkbox>
        </Form.Item>
      )}
      <Form.Item name="isPrivate" valuePropName="checked">
        <Checkbox disabled={openChanAsync.loading}>{l('private')}</Checkbox>
      </Form.Item>
    </Form>
  );

  if (getBalancesAsync.loading) {
    cmp = <Loader />;
  } else if (getBalancesAsync.error) {
    cmp = (
      <Alert
        type="error"
        message={l('balancesError')}
        description={getBalancesAsync.error.message}
      />
    );
  }

  return (
    <>
      <Modal
        title={l('title')}
        open={visible}
        onCancel={() => hideOpenChannel()}
        destroyOnClose
        cancelText={l('cancelBtn')}
        okText={l('okBtn')}
        okButtonProps={{
          loading: openChanAsync.loading,
          disabled: sameNode,
        }}
        onOk={form.submit}
      >
        {cmp}
      </Modal>
    </>
  );
};

export default OpenChannelModal;
