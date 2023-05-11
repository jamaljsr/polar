import React, { useEffect, useMemo, useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { Alert, Checkbox, Form, Input, InputNumber, Modal, Select } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { Status, TarodNode } from 'shared/types';
import { TARO_ASSET_TYPE } from 'lib/taro/types';
import { useStoreActions, useStoreState } from 'store';
import { MintAssetPayload, TARO_MIN_LND_BALANCE } from 'store/models/taro';
import { Network } from 'types';

interface Props {
  network: Network;
}

const MintAssetModal: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation('cmps.designer.taro.actions.MintAssetModal');

  const { visible, nodeName } = useStoreState(s => s.modals.mintAsset);
  const { nodes: lightningNodes } = useStoreState(s => s.lightning);

  const { hideMintAsset } = useStoreActions(s => s.modals);
  const { mintAsset } = useStoreActions(s => s.taro);
  const { notify } = useStoreActions(s => s.app);
  const { getWalletBalance } = useStoreActions(s => s.lightning);

  const [autoDepositFunds, setAutoDepositFunds] = useState<boolean>(false);
  const [form] = Form.useForm();
  const assetType: number = Form.useWatch('assetType', form);
  const assetName: string = Form.useWatch('name', form) || '';

  const thisTaroNode = network.nodes.taro.find(
    node => node.name === nodeName,
  ) as TarodNode;

  const mintAssetAsync = useAsyncCallback(async (payload: MintAssetPayload) => {
    try {
      await mintAsset(payload);
      notify({
        message: l('mintSuccess', {
          name: payload.name,
          amt: payload.amount,
        }),
      });
      hideMintAsset();
    } catch (error: any) {
      const { amount, name } = payload;
      notify({ message: l('mintError', { amount, name }), error });
    }
  });
  // replace this with getBallance and get assets
  useEffect(() => {
    // When polar is first opened, we need to populate the state with the lightning node data
    const lndNode = network.nodes.lightning.find(n => n.name === thisTaroNode?.lndName);
    if (lndNode?.status !== Status.Started) return;
    getWalletBalance(lndNode);
  }, []);

  const lowBalance = useMemo(() => {
    const lndNodeModel = lightningNodes[thisTaroNode?.lndName];
    return Number(lndNodeModel?.walletBalance?.confirmed) < TARO_MIN_LND_BALANCE;
  }, [lightningNodes, thisTaroNode]);

  const handleSubmit = (values: {
    assetType: number;
    name: string;
    amount: number;
    enableEmission: boolean;
    finalize: boolean;
    autoFund: boolean;
  }) => {
    const payload: MintAssetPayload = {
      node: thisTaroNode,
      assetType: assetType === 1 ? TARO_ASSET_TYPE.COLLECTIBLE : TARO_ASSET_TYPE.NORMAL,
      name: values.name,
      amount: values.amount,
      enableEmission: values.enableEmission,
      finalize: values.finalize,
      autoFund: values.autoFund,
    };
    mintAssetAsync.execute(payload);
  };

  const cmp = (
    <>
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        colon={false}
        initialValues={{
          assetType: 0,
          name: '',
          amount: 1000,
          enableEmission: false,
          finalize: true,
          autoFund: false,
        }}
        onFinish={handleSubmit}
      >
        <Form.Item name="assetType" label={l('assetType')}>
          <Select placeholder={l('assetTypePlaceholder')}>
            <Select.Option value={0}>{l('assetTypeNormal')}</Select.Option>
            <Select.Option value={1}>{l('assetTypeCollectible')}</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="name"
          label={l('name')}
          rules={[{ required: true, message: l('cmps.forms.required') }]}
        >
          <Input placeholder={l('namePlaceholder')} />
        </Form.Item>
        <Form.Item name="amount" label={l('amount')}>
          <InputNumber<number>
            placeholder={l('amountPlaceholder')}
            disabled={assetType === 1}
            style={{ width: '100%' }}
            formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={v => parseInt(`${v}`.replace(/(undefined|,*)/g, ''))}
            min={1}
          />
        </Form.Item>
        {/*
        Hidden until asset groups is fully supported
        <Form.Item name="enableEmission" valuePropName="checked">
          <Checkbox>{l('enableEmission')}</Checkbox>
        </Form.Item> 
        */}
        <Form.Item name="finalize" valuePropName="checked">
          <Checkbox>{l('finalize')}</Checkbox>
        </Form.Item>
        {lowBalance && !autoDepositFunds && (
          <Alert
            type="warning"
            message={l('lndBalanceError', { lndNode: thisTaroNode?.lndName })}
          />
        )}
        {lowBalance && (
          <Form.Item name="autoFund" valuePropName="checked">
            <Checkbox onChange={e => setAutoDepositFunds(e.target.checked)}>
              {l('deposit', { selectedFrom: thisTaroNode?.lndName })}
            </Checkbox>
          </Form.Item>
        )}
      </Form>
    </>
  );

  return (
    <>
      <Modal
        title={l('title', { name: thisTaroNode?.name })}
        open={visible}
        onCancel={() => hideMintAsset()}
        destroyOnClose
        cancelText={l('cancelBtn')}
        okText={l('okBtn')}
        okButtonProps={{
          loading: mintAssetAsync.loading,
          disabled: (lowBalance && !autoDepositFunds) || assetName.length === 0,
        }}
        cancelButtonProps={{ disabled: mintAssetAsync.loading }}
        onOk={form.submit}
      >
        {cmp}
      </Modal>
    </>
  );
};

export default MintAssetModal;
