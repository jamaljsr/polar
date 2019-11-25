import React from 'react';
import { useAsync, useAsyncCallback } from 'react-async-hook';
import { Alert, Checkbox, Col, Form, InputNumber, Modal, Row } from 'antd';
import { FormComponentProps } from 'antd/lib/form';
import { usePrefixedTranslation } from 'hooks';
import { useStoreActions, useStoreState } from 'store';
import { OpenChannelPayload } from 'store/models/lnd';
import { Network } from 'types';
import { Loader } from 'components/common';
import LightningNodeSelect from 'components/common/form/LightningNodeSelect';

interface FormFields {
  from: string;
  to: string;
  sats: string;
  autoFund: boolean;
}

interface Props extends FormComponentProps<FormFields> {
  network: Network;
}

const OpenChannelModal: React.FC<Props> = ({ network, form }) => {
  const { l } = usePrefixedTranslation('cmps.designer.lnd.actions.OpenChannelModal');
  const { nodes } = useStoreState(s => s.lnd);
  const { visible, to, from } = useStoreState(s => s.modals.openChannel);
  const { hideOpenChannel } = useStoreActions(s => s.modals);
  const { getWalletBalance, openChannel } = useStoreActions(s => s.lnd);
  const { notify } = useStoreActions(s => s.app);

  const getBalancesAsync = useAsync(async () => {
    if (!visible) return;
    for (const node of network.nodes.lightning) {
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

  const handleSubmit = () => {
    form.validateFields((err, values: FormFields) => {
      if (err) return;

      const { lightning } = network.nodes;
      const fromNode = lightning.find(n => n.name === values.from);
      const toNode = lightning.find(n => n.name === values.to);
      if (!fromNode || !toNode) return;
      const autoFund = showDeposit && values.autoFund;
      openChanAsync.execute({ from: fromNode, to: toNode, sats: values.sats, autoFund });
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
            label={l('source')}
            disabled={openChanAsync.loading}
            initialValue={from}
            nodes={nodes}
          />
        </Col>
        <Col span={12}>
          <LightningNodeSelect
            network={network}
            id="to"
            form={form}
            label={l('dest')}
            disabled={openChanAsync.loading}
            initialValue={to}
            nodes={nodes}
          />
        </Col>
      </Row>
      <Form.Item
        label={l('capacityLabel') + ' (sats)'}
        help={l('capacityInfo', {
          min: '20,000 sats',
          max: '16,777,216 sats',
        })}
      >
        {form.getFieldDecorator('sats', {
          initialValue: 250000,
          rules: [{ required: true, message: l('cmps.forms.required') }],
        })(
          <InputNumber
            min={20000}
            disabled={openChanAsync.loading}
            formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={v => `${v}`.replace(/(undefined|,*)/g, '')}
            style={{ width: '100%' }}
          />,
        )}
      </Form.Item>
      {showDeposit && (
        <Form.Item>
          {form.getFieldDecorator('autoFund', {
            valuePropName: 'checked',
            initialValue: true,
          })(
            <Checkbox disabled={openChanAsync.loading}>
              Deposit enough funds to {selectedFrom} to open the channel
            </Checkbox>,
          )}
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
        closable={false}
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
        onOk={handleSubmit}
      >
        {cmp}
      </Modal>
    </>
  );
};

export default Form.create<Props>()(OpenChannelModal);
