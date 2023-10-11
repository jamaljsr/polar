import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { Alert, Checkbox, Form, Input, InputNumber, Modal, Select } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { Status, TapdNode } from 'shared/types';
import { TAP_ASSET_TYPE } from 'lib/tap/types';
import { useStoreActions, useStoreState } from 'store';
import { MintAssetPayload, TAP_MIN_LND_BALANCE } from 'store/models/tap';
import { Network } from 'types';

interface Props {
  network: Network;
}

const MintAssetModal: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation('cmps.designer.tap.actions.MintAssetModal');

  const { visible, nodeName } = useStoreState(s => s.modals.mintAsset);
  const { nodes: lightningNodes } = useStoreState(s => s.lightning);

  const { hideMintAsset } = useStoreActions(s => s.modals);
  const { mintAsset } = useStoreActions(s => s.tap);
  const { notify } = useStoreActions(s => s.app);
  const { getWalletBalance } = useStoreActions(s => s.lightning);

  const [autoDepositFunds, setAutoDepositFunds] = useState<boolean>(false);
  const [form] = Form.useForm();
  const assetType: number = Form.useWatch('assetType', form);
  const assetName: string = Form.useWatch('name', form) || '';

  const thisTapNode = network.nodes.tap.find(node => node.name === nodeName) as TapdNode;

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
    const lndNode = network.nodes.lightning.find(n => n.name === thisTapNode?.lndName);
    if (lndNode?.status !== Status.Started) return;
    getWalletBalance(lndNode);
  }, []);

  const handleTypeChange = useCallback((value: number) => {
    form.setFieldsValue({ amount: value === 1 ? 1 : 1000 });
  }, []);

  const lowBalance = useMemo(() => {
    const lndNodeModel = lightningNodes[thisTapNode?.lndName];
    return Number(lndNodeModel?.walletBalance?.confirmed) < TAP_MIN_LND_BALANCE;
  }, [lightningNodes, thisTapNode]);

  const handleSubmit = (values: {
    assetType: number;
    name: string;
    amount: number;
    enableEmission: boolean;
    finalize: boolean;
    autoFund: boolean;
  }) => {
    const payload: MintAssetPayload = {
      node: thisTapNode,
      assetType: assetType === 1 ? TAP_ASSET_TYPE.COLLECTIBLE : TAP_ASSET_TYPE.NORMAL,
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
          <Select<number>
            placeholder={l('assetTypePlaceholder')}
            onChange={handleTypeChange}
          >
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
            message={l('lndBalanceError', { lndNode: thisTapNode?.lndName })}
          />
        )}
        {lowBalance && (
          <Form.Item name="autoFund" valuePropName="checked">
            <Checkbox onChange={e => setAutoDepositFunds(e.target.checked)}>
              {l('deposit', { selectedFrom: thisTapNode?.lndName })}
            </Checkbox>
          </Form.Item>
        )}
      </Form>
    </>
  );

  return (
    <>
      <Modal
        title={l('title', { name: thisTapNode?.name })}
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
