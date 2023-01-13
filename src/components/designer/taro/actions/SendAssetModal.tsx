import React, { useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { Alert, Button, Form, InputNumber, Modal } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { Status, TarodNode, TaroNode } from 'shared/types';
import * as PTARO from 'lib/taro/types';
import { useStoreActions, useStoreState } from 'store';
import { SendAssetPayload } from 'store/models/taro';
import { Network } from 'types';
import TaroAssetSelect from 'components/common/form/TaroAssetSelect';
import TaroNodeSelect from 'components/common/form/TaroNodeSelect';

const TaroBalanceSelect = TaroAssetSelect;

const getSelectedTaroNode = (network: Network) => {
  const { selected: selectedNode } = useStoreState(s => s.designer.activeChart);
  return network.nodes.taro.find(node => node.name === selectedNode.id) as TarodNode;
};
interface Props {
  network: Network;
}

const SendAssetModal: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation('cmps.designer.taro.actions.SendAssetModal');

  //app
  const { notify } = useStoreActions(s => s.app);

  //bitcoin actions
  const { mine } = useStoreActions(s => s.bitcoind);

  //designer actions
  const { syncChart } = useStoreActions(s => s.designer);

  //modal visibility
  const { visible } = useStoreState(s => s.modals.sendAsset);
  const { hideSendAsset } = useStoreActions(s => s.modals);

  //modal parameters
  const [selectedFromBalance, setSelectedFromBalance] = useState<PTARO.TaroBalance>();
  const [selectedBalanceAmount, setSelectedBalanceAmount] = useState<
    string | number | null
  >(10);
  const [selectedTo, setSelectedTo] = useState<string>();

  //modal validation
  const [valid, validate] = useState<boolean>();
  const [alertMessage, setAlertMessage] = useState<string>();

  //taro model
  const { nodes: taroNodes } = useStoreState(s => s.taro);
  const { sendAsset } = useStoreActions(s => s.taro);

  //component local variables
  const [form] = Form.useForm();
  const thisTaroNode = getSelectedTaroNode(network);
  const balances: PTARO.TaroBalance[] = taroNodes[thisTaroNode.name].balances || [];

  //validators
  const recipientHasAsset = () => {
    if (selectedTo && selectedFromBalance) {
      const assets = taroNodes[selectedTo]?.assets;
      if (assets) {
        return assets.find(b => b.id === selectedFromBalance.id) ? true : false;
      } else {
        return undefined;
      }
    }
  };

  //handlers
  const handleSelectBalance = (value: number) => {
    setSelectedFromBalance(balances[value]);
  };

  const sendAssetAsync = useAsyncCallback(async (payload: SendAssetPayload) => {
    try {
      await sendAsset(payload);
      await mine({ blocks: 1, node: network.nodes.bitcoin[0] });
      await syncChart(network);
      hideSendAsset();
    } catch (error: any) {
      notify({ message: l('submitError'), error });
    }
  });

  const handleSubmit = (values: any) => {
    console.log('Submited');
    const toNode = network.nodes.taro.find(node => node.name === values.to) as TaroNode;
    if (!toNode) {
      notify({ message: l('submitError') });
      return;
    }
    const genesisBootstrapInfo = selectedFromBalance?.genesisBootstrapInfo;
    if (!genesisBootstrapInfo) {
      notify({
        message: l('missingGenesisInfo', { to: selectedTo, asset: selectedFromBalance }),
      });
      return;
    }
    const payload: SendAssetPayload = {
      from: thisTaroNode,
      to: toNode,
      genesisBootstrapInfo: genesisBootstrapInfo,
      amount: values.amount,
    };
    sendAssetAsync.execute(payload);
  };

  const cmp = (
    <>
      <Form
        form={form}
        layout="vertical"
        colon={false}
        initialValues={{
          balanceIndex: 0,
          amount: 1,
          to: network.nodes.taro[0].name,
        }}
        onFinish={handleSubmit}
      >
        {recipientHasAsset() && (
          <Alert
            type="error"
            message={l('missingGenesisInfo', {
              to: selectedTo,
              asset: selectedFromBalance,
            })}
          >
            <Button>Fix</Button>
          </Alert>
        )}
        {balances && balances.length > 0 && (
          <TaroBalanceSelect
            name="balanceIndex"
            label={l('balanceSelect')}
            items={balances}
            onChange={v => handleSelectBalance(v?.valueOf() as number)}
          />
        )}
        <Form.Item label={l('amount')} name="amount">
          <InputNumber
            disabled={selectedFromBalance?.type === 'COLLECTIBLE'}
            value={selectedBalanceAmount}
            onChange={setSelectedBalanceAmount}
            max={Number(selectedFromBalance?.balance)}
            min={1}
          />
        </Form.Item>
        <TaroNodeSelect
          name="to"
          label={l('recipient')}
          help={l('recipientHelp')}
          networkNodes={network.nodes.taro}
          nodeStatus={Status.Started}
          onChange={v => setSelectedTo(v?.valueOf() as string)}
        />
      </Form>
    </>
  );

  return (
    <>
      <Modal
        title={l('title', { name: thisTaroNode.name })}
        open={visible}
        destroyOnClose
        cancelText={l('cancelBtn')}
        okText={l('okBtn')}
        onCancel={() => hideSendAsset()}
        // okButtonProps={{
        //   disabled: validateForm(),
        // }}
        onOk={form.submit}
      >
        {cmp}
      </Modal>
    </>
  );
};

export default SendAssetModal;
