import React, { useState } from 'react';
import { useAsyncCallback, useAsync } from 'react-async-hook';
import { Checkbox, Form, InputNumber, Modal, Row, Input, Button } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { TaroNode, TarodNode, Status } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { Network } from 'types';
import * as TARO from 'shared/tarodTypes';

interface Props {
  network: Network;
}
const MintAssetModal: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation('cmps.designer.taro.actions.MintAssetModal');

  const { visible, nodeName } = useStoreState(s => s.modals.mintAsset);
  const { selectedNode } = useStoreState(s => s.designer);
  const { nodes: lightningNodes } = useStoreState(s => s.lightning);
  const { nodes: taronodes } = useStoreState(s => s.taro);

  const { hideMintAsset } = useStoreActions(s => s.modals);
  const { mintAsset } = useStoreActions(s => s.taro);
  const { getWalletBalance } = useStoreActions(s => s.lightning);
  const { mine } = useStoreActions(s => s.bitcoind);
  const { notify } = useStoreActions(s => s.app);
  const { syncChart } = useStoreActions(s => s.designer);

  const [isCollectible, setIsCollectible] = useState(Boolean);
  const [assetName, setAssetName] = useState('My New Asset');
  const [form] = Form.useForm();

  const thisTaroNode = network.nodes.taro.find(
    node => node.name === selectedNode.id,
  ) as TarodNode;

  const isLndBalanceValid = async () => {
    const lndNode = lightningNodes[thisTaroNode.lndName];
    if (lndNode.walletBalance) {
      await getBalancesAsync.execute();
      if (Number(lndNode.walletBalance?.confirmed) > 0) {
        return true;
      } else {
        notify({ message: l('lndBalanceError', { lndNode: thisTaroNode.lndName }) });
        return false;
      }
    } else {
      return false;
    }
  };
  const getBalancesAsync = useAsync(async () => {
    if (!visible) return;
    const nodes = network.nodes.lightning.filter(n => n.status === Status.Started);
    for (const node of nodes) {
      await getWalletBalance(node);
    }
  }, [network.nodes, visible]);

  const mintAssetAsync = useAsyncCallback(
    async (node: TaroNode, req: TARO.MintAssetRequest) => {
      try {
        if (await isLndBalanceValid()) {
          await mintAsset({ node, req });
          await mine({ blocks: 1, node: network.nodes.bitcoin[0] });
          await syncChart(network);
          notify({
            message: l('mintSuccess', {
              name: assetName,
              batchKey: taronodes[thisTaroNode.name].batchKey,
            }),
          });
          hideMintAsset();
        }
      } catch (error: any) {
        notify({ message: l('mintError'), error });
      }
    },
  );
  const handleCollectible = (e: any) => {
    setIsCollectible(e.target.checked);
  };

  const handleAssetName = (e: any) => {
    setAssetName(e.target.value);
  };

  const handleSubmit = (values: {
    assetType: boolean;
    name: string;
    amount: number;
    metaData: string;
    enableEmission: boolean;
    skipBatch: boolean;
  }) => {
    const req: TARO.MintAssetRequest = {
      assetType: values.assetType ? 'COLLECTIBLE' : 'NORMAL',
      name: values.name,
      amount: values.assetType ? 1 : values.amount,
      metaData: Buffer.from(values.metaData, 'hex'),
      enableEmission: values.enableEmission,
      skipBatch: values.skipBatch,
    };

    mintAssetAsync.execute(thisTaroNode, req);
  };

  const cmp = (
    <>
      <Form
        form={form}
        layout="vertical"
        colon={false}
        initialValues={{
          assetType: false,
          name: assetName,
          amount: 10000,
          metaData: 'My Asset Meta Data',
          enableEmission: false,
          skipBatch: true,
        }}
        onFinish={handleSubmit}
      >
        <Form.Item name="assetType" valuePropName="checked" help={l('collectibleHelp')}>
          <Checkbox checked={isCollectible} onClick={handleCollectible}>
            {l('collectible')}
          </Checkbox>
        </Form.Item>
        <Form.Item
          name="amount"
          label={l('amount')}
          help={isCollectible ? l('collectibleAmountHelp') : l('normalAmountHelp')}
        >
          <InputNumber<number>
            disabled={isCollectible}
            style={{ width: '100%' }}
            formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={v => parseInt(`${v}`.replace(/(undefined|,*)/g, ''))}
          />
        </Form.Item>
        <Form.Item name="name" label={l('name')} help={l('nameHelp')}>
          <Input placeholder="Name your asset" onChangeCapture={handleAssetName} />
        </Form.Item>
        <Form.Item name="metaData" label={l('metaData')} help={l('metaDataHelp')}>
          <Input.TextArea rows={5} placeholder="Meta Data" showCount />
        </Form.Item>
        <Form.Item
          name="enableEmission"
          valuePropName="checked"
          help={l('enableEmissionHelp')}
        >
          <Checkbox>{l('enableEmission')}</Checkbox>
        </Form.Item>
        <Form.Item name="skipBatch" valuePropName="checked" help={l('skipBatchHelp')}>
          <Checkbox>{l('skipBatch')}</Checkbox>
        </Form.Item>
      </Form>
    </>
  );

  return (
    <>
      <Modal
        title={l('title', { name: thisTaroNode.name })}
        open={visible}
        onCancel={() => hideMintAsset()}
        destroyOnClose
        cancelText={l('cancelBtn')}
        okText={l('okBtn')}
        okButtonProps={{
          loading: mintAssetAsync.loading,
        }}
        onOk={form.submit}
      >
        {cmp}
      </Modal>
    </>
  );
};

export default MintAssetModal;
