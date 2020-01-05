import React from 'react';
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
  const { nodes } = useStoreState(s => s.lightning);
  const { visible, to, from } = useStoreState(s => s.modals.openChannel);
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
    } catch (error) {
      notify({ message: l('submitError'), error });
    }
  });

  // flag to show the deposit checkbox if the from node balance is less than the capacity
  let showDeposit = false;
  const selectedFrom = form.getFieldValue('from') || from;
  const areSameNodesSelected = selectedFrom === (form.getFieldValue('to') || to);
  if (selectedFrom && nodes[selectedFrom] && !openChanAsync.loading) {
    const { confirmed } = nodes[selectedFrom].walletBalance || {};
    const balance = parseInt(confirmed || '0');
    const sats = form.getFieldValue('sats');
    showDeposit = balance <= sats && !areSameNodesSelected;
  }

  const handleSubmit = (values: any) => {
    const { lightning } = network.nodes;
    const fromNode = lightning.find(n => n.name === values.from);
    const toNode = lightning.find(n => n.name === values.to);
    if (!fromNode || !toNode) return;
    const autoFund = showDeposit && values.autoFund;
    openChanAsync.execute({ from: fromNode, to: toNode, sats: values.sats, autoFund });
  };

  let cmp = (
    <Form
      form={form}
      hideRequiredMark
      colon={false}
      initialValues={{ from, to, sats: 250000, autoFund: true }}
      onFinish={handleSubmit}
    >
      {areSameNodesSelected && <Alert type="error" message={l('sameNodesWarnMsg')} />}
      <Row gutter={16}>
        <Col span={12}>
          <LightningNodeSelect
            network={network}
            name="from"
            form={form}
            label={l('source')}
            disabled={openChanAsync.loading}
            status={Status.Started}
            nodes={nodes}
          />
        </Col>
        <Col span={12}>
          <LightningNodeSelect
            network={network}
            name="to"
            form={form}
            label={l('dest')}
            disabled={openChanAsync.loading}
            status={Status.Started}
            nodes={nodes}
          />
        </Col>
      </Row>
      <Form.Item
        name="sats"
        label={l('capacityLabel') + ' (sats)'}
        help={l('capacityInfo', {
          min: '20,000 sats',
          max: '16,777,216 sats',
        })}
        rules={[{ required: true, message: l('cmps.forms.required') }]}
      >
        <InputNumber
          min={20000}
          disabled={openChanAsync.loading}
          formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={v => `${v}`.replace(/(undefined|,*)/g, '')}
          style={{ width: '100%' }}
        />
      </Form.Item>
      {showDeposit && (
        <Form.Item name="autoFund" valuePropName="checked">
          <Checkbox disabled={openChanAsync.loading}>
            Deposit enough funds to {selectedFrom} to open the channel
          </Checkbox>
        </Form.Item>
      )}
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
        visible={visible}
        onCancel={() => hideOpenChannel()}
        destroyOnClose
        cancelText={l('cancelBtn')}
        okText={l('okBtn')}
        okButtonProps={{
          loading: openChanAsync.loading,
          disabled: areSameNodesSelected,
        }}
        onOk={form.submit}
      >
        {cmp}
      </Modal>
    </>
  );
};

export default OpenChannelModal;
