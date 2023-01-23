import React, { useEffect, useMemo, useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { Alert, Checkbox, Form, Input, InputNumber, Modal, Select } from 'antd';
import { SelectValue } from 'antd/lib/select';
import { usePrefixedTranslation } from 'hooks';
import { TarodNode } from 'shared/types';
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
  const { nodes: taroNodes } = useStoreState(s => s.taro);

  const { hideMintAsset } = useStoreActions(s => s.modals);
  const { mintAsset } = useStoreActions(s => s.taro);
  const { notify } = useStoreActions(s => s.app);
  const { syncChart } = useStoreActions(s => s.designer);

  const [isCollectible, setIsCollectible] = useState<boolean>(false);
  const [isAssetNameUnique, setIsAssetNameUnique] = useState<boolean>(true);

  const [isLNDBalanceLow, setIsLNDBalanceLow] = useState<boolean>(false);
  const [autoDepositFunds, setAutoDepositFunds] = useState<boolean>(false);
  const [assetName, setAssetName] = useState('');
  const [form] = Form.useForm();

  const thisTaroNode = network.nodes.taro.find(
    node => node.name === nodeName,
  ) as TarodNode;
  const assets = taroNodes[thisTaroNode?.name]?.assets || [];

  const mintAssetAsync = useAsyncCallback(async (payload: MintAssetPayload) => {
    try {
      const res = await mintAsset(payload);
      notify({
        message: l('mintSuccess', {
          name: assetName,
          batchKey: res.batchKey,
        }),
      });
      hideMintAsset();
    } catch (error: any) {
      notify({ message: l('mintError'), error });
    }
  });

  useEffect(() => {
    //When polar is first opened, we need to populate the state with the lightning node data
    syncChart(network);
  }, []);

  useMemo(() => {
    const lndNodeModel = lightningNodes[thisTaroNode?.lndName];
    lndNodeModel &&
      setIsLNDBalanceLow(
        Number(lndNodeModel.walletBalance?.confirmed) < TARO_MIN_LND_BALANCE,
      );
  }, [network.nodes.lightning, lightningNodes]);

  const handleCollectible = (value: SelectValue) => {
    setIsCollectible(value === 1);
  };

  const handleAssetName = (e: any) => {
    setAssetName(e.target.value);
    const foundAsset = assets.find(asset => asset.name === e.target.value);
    setIsAssetNameUnique(foundAsset === undefined);
  };

  const handleSubmit = (values: {
    assetType: boolean;
    name: string;
    amount: number;
    metaData: string;
    enableEmission: boolean;
    skipBatch: boolean;
    autoFund: boolean;
  }) => {
    const payload: MintAssetPayload = {
      node: thisTaroNode,
      assetType: isCollectible ? TARO_ASSET_TYPE.COLLECTIBLE : TARO_ASSET_TYPE.NORMAL,
      name: values.name,
      amount: values.amount,
      metaData: values.metaData,
      enableEmission: values.enableEmission,
      skipBatch: values.skipBatch,
      autoFund: values.autoFund,
    };
    mintAssetAsync.execute(payload);
  };

  const cmp = (
    <>
      <Form
        form={form}
        layout="vertical"
        colon={false}
        initialValues={{
          enableEmission: false,
          assetType: 0,
          amount: 1,
          skipBatch: true,
          autoFund: false,
          metaData: '',
          name: '',
        }}
        onFinish={handleSubmit}
      >
        <Form.Item name="assetType" label={l('assetType')}>
          <Select placeholder={l('assetTypePlaceholder')} onChange={handleCollectible}>
            <Select.Option value={0}>{l('assetTypeNormal')}</Select.Option>
            <Select.Option value={1}>{l('assetTypeCollectible')}</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="amount" label={l('amount')}>
          <InputNumber<number>
            disabled={isCollectible}
            placeholder={l('amountPlaceholder')}
            style={{ width: '100%' }}
            formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={v => parseInt(`${v}`.replace(/(undefined|,*)/g, ''))}
            min={1}
          />
        </Form.Item>
        <Form.Item
          name="name"
          label={l('name')}
          help={isAssetNameUnique ? '' : l('nameError')}
        >
          <Input
            placeholder={l('namePlaceholder')}
            onChange={handleAssetName}
            status={isAssetNameUnique ? '' : 'error'}
          />
        </Form.Item>
        <Form.Item name="metaData" label={l('metaData')}>
          <Input.TextArea rows={5} placeholder={l('metaDataPlaceholder')} showCount />
        </Form.Item>
        <Form.Item name="enableEmission" valuePropName="checked">
          <Checkbox>{l('enableEmission')}</Checkbox>
        </Form.Item>
        <Form.Item name="skipBatch" valuePropName="checked">
          <Checkbox>{l('skipBatch')}</Checkbox>
        </Form.Item>
        {isLNDBalanceLow && !autoDepositFunds && (
          <Alert
            type="warning"
            message={l('lndBalanceError', { lndNode: thisTaroNode?.lndName })}
          />
        )}
        <Form.Item name="autoFund" valuePropName="checked">
          <Checkbox onChange={e => setAutoDepositFunds(e.target.checked)}>
            {l('deposit', { selectedFrom: thisTaroNode?.lndName })}
          </Checkbox>
        </Form.Item>
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
          disabled:
            (isLNDBalanceLow && !autoDepositFunds) ||
            !isAssetNameUnique ||
            assetName.length === 0,
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
