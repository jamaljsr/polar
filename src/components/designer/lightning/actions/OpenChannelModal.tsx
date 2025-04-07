import React, { useCallback, useMemo } from 'react';
import { useAsync, useAsyncCallback } from 'react-async-hook';
import { Alert, Checkbox, Col, Form, InputNumber, Modal, Row } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { Status } from 'shared/types';
import { TapBalance } from 'lib/tap/types';
import { useStoreActions, useStoreState } from 'store';
import { Network } from 'types';
import { mapToTapd } from 'utils/network';
import { formatDecimals } from 'utils/numbers';
import { Loader } from 'components/common';
import LightningNodeSelect from 'components/common/form/LightningNodeSelect';
import TapAssetSelect from 'components/common/form/TapAssetSelect';

interface FormValues {
  isPrivate: boolean;
  autoFund: boolean;
  to: string;
  from: string;
  capacity: string;
}

interface Props {
  network: Network;
}

const OpenChannelModal: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation(
    'cmps.designer.lightning.actions.OpenChannelModal',
  );
  const { nodes } = useStoreState(s => s.lightning);
  const { nodes: tapNodes } = useStoreState(s => s.tap);
  const { visible, to, from } = useStoreState(s => s.modals.openChannel);
  const { hideOpenChannel } = useStoreActions(s => s.modals);
  const { getWalletBalance, openChannel, depositFunds } = useStoreActions(
    s => s.lightning,
  );
  const { fundChannel } = useStoreActions(s => s.tap);
  const { getAssets, getBalances } = useStoreActions(s => s.tap);
  const { notify } = useStoreActions(s => s.app);

  const [form] = Form.useForm();
  const assetId = Form.useWatch<string>('assetId', form) || 'sats';
  const selectedFrom = Form.useWatch<string>('from', form) || '';
  const selectedTo = Form.useWatch<string>('to', form) || '';
  const capacity = Form.useWatch<number>('capacity', form) || 0;

  const getBalancesAsync = useAsync(async () => {
    if (!visible) return;
    const nodes = network.nodes.lightning.filter(n => n.status === Status.Started);
    for (const node of nodes) {
      await getWalletBalance(node);
    }
    const litNodes = nodes.filter(n => n.implementation === 'litd').map(mapToTapd);
    for (const node of litNodes) {
      await getAssets(node);
      await getBalances(node);
    }
  }, [network.nodes, visible]);

  const openChanAsync = useAsyncCallback(async (values: FormValues) => {
    try {
      const { lightning } = network.nodes;
      const fromNode = lightning.find(n => n.name === values.from);
      const toNode = lightning.find(n => n.name === values.to);
      if (!fromNode || !toNode) return;

      if (assetId === 'sats') {
        // open a normal BTC channel
        await openChannel({
          from: fromNode,
          to: toNode,
          sats: values.capacity,
          autoFund: showDeposit && values.autoFund,
          isPrivate: values.isPrivate,
        });
      } else {
        // automatically deposit funds when the node doesn't have enough BTC to open the
        // channel. The node needs at least 100,000 sats + fees to open an asset channel.
        if (values.autoFund) await depositFunds({ node: fromNode, sats: '500000' });

        const asset = Object.values(tapNodes)
          .flatMap(n => n.assets)
          .find(a => a?.id === assetId);
        if (!asset) throw new Error('Invalid asset selected');

        // open an asset channel
        await fundChannel({
          from: mapToTapd(fromNode),
          to: toNode,
          amount: Math.floor(Number(values.capacity) * 10 ** asset.decimals),
          assetId,
        });
      }
      hideOpenChannel();
    } catch (error: any) {
      notify({ message: l('submitError'), error });
    }
  });

  const sameNode = selectedFrom === selectedTo;
  const showDeposit = useMemo(() => {
    const confirmed = nodes?.[selectedFrom]?.walletBalance?.confirmed || '0';
    const balance = parseInt(confirmed);
    const hasLowBalance = assetId === 'sats' ? balance < capacity : balance < 5000;
    return !sameNode && hasLowBalance;
  }, [selectedFrom, capacity, nodes, sameNode, assetId]);

  const showAssets = useMemo(() => {
    const fromNode = network.nodes.lightning.find(n => n.name === selectedFrom);
    const toNode = network.nodes.lightning.find(n => n.name === selectedTo);
    return fromNode?.implementation === 'litd' && toNode?.implementation === 'litd';
  }, [selectedFrom, selectedTo, network.nodes.lightning]);

  const calcCapacity = useCallback(
    (assetId?: string) => {
      if (assetId === 'sats') return 10_000_000;

      // its safe to cast because this will only be called with a valid assetId
      const asset = tapNodes[selectedFrom]?.balances?.find(
        b => b.id === assetId,
      ) as TapBalance;
      const decimals =
        tapNodes[selectedFrom]?.assets?.find(a => a.id === assetId)?.decimals || 0;
      return formatDecimals(parseInt(asset.balance), decimals);
    },
    [showAssets, selectedFrom, assetId, tapNodes],
  );

  let cmp = (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
      colon={false}
      initialValues={{
        from,
        to,
        capacity: 10_000_000,
        autoFund: true,
        isPrivate: false,
        assetId: 'sats',
      }}
      onFinish={openChanAsync.execute}
      disabled={openChanAsync.loading}
    >
      {sameNode && <Alert type="error" message={l('sameNodesWarnMsg')} />}
      <Row gutter={16}>
        <Col span={12}>
          <LightningNodeSelect
            network={network}
            name="from"
            label={l('source')}
            nodeStatus={Status.Started}
            initialValue={from}
            nodes={nodes}
          />
        </Col>
        <Col span={12}>
          <LightningNodeSelect
            network={network}
            name="to"
            label={l('dest')}
            nodeStatus={Status.Started}
            initialValue={to}
            nodes={nodes}
          />
        </Col>
      </Row>
      {showAssets && (
        <TapAssetSelect
          name="assetId"
          label={l('asset')}
          network={network}
          nodeName={selectedFrom}
          tapNodesState={tapNodes}
          onChange={value =>
            form.setFieldsValue({ capacity: calcCapacity(value?.toString()) })
          }
        />
      )}
      <Form.Item
        name="capacity"
        label={l('capacityLabel')}
        rules={[{ required: true, message: l('cmps.forms.required') }]}
      >
        <InputNumber<number>
          formatter={v =>
            `${v}`
              // add commas between every 3 digits
              .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
              // remove commas after the decimal point
              .replace(/\..*/, match => match.replace(/,/g, ''))
          }
          parser={v => parseFloat(`${v}`.replace(/(undefined|,*)/g, ''))}
          style={{ width: '100%' }}
        />
      </Form.Item>
      {showDeposit && (
        <Form.Item name="autoFund" valuePropName="checked">
          <Checkbox>{l('deposit', { selectedFrom })}</Checkbox>
        </Form.Item>
      )}
      {assetId === 'sats' && (
        <Form.Item name="isPrivate" valuePropName="checked">
          <Checkbox>{l('private')}</Checkbox>
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
