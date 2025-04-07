import React, { useCallback, useMemo } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import {
  Alert,
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Slider,
} from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { TAP_ASSET_TYPE } from 'lib/tap/types';
import { useStoreActions, useStoreState } from 'store';
import { MintAssetPayload, TAP_MIN_LND_BALANCE } from 'store/models/tap';
import { Network } from 'types';
import { mapToTapd } from 'utils/network';
import { formatDecimals } from 'utils/numbers';

interface Props {
  network: Network;
}

const MintAssetModal: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation('cmps.designer.tap.actions.MintAssetModal');

  const { visible, nodeName, lndName } = useStoreState(s => s.modals.mintAsset);
  const { nodes: lightningNodes } = useStoreState(s => s.lightning);

  const { hideMintAsset } = useStoreActions(s => s.modals);
  const { mintAsset } = useStoreActions(s => s.tap);
  const { notify } = useStoreActions(s => s.app);

  const [form] = Form.useForm();
  const assetType: number = Form.useWatch('assetType', form);
  const assetName: string = Form.useWatch('name', form) || '';
  const autoFund: string = Form.useWatch('autoFund', form);
  const amount: number = Form.useWatch('amount', form);
  const decimals: number = Form.useWatch('decimals', form);

  const mintAssetAsync = useAsyncCallback(async (payload: MintAssetPayload) => {
    try {
      await mintAsset(payload);
      const amt = formatDecimals(payload.amount, payload.decimals);
      notify({
        message: l('mintSuccess', { name: payload.name, amt }),
      });
      hideMintAsset();
    } catch (error: any) {
      const { amount, name } = payload;
      notify({ message: l('mintError', { amount, name }), error });
    }
  });

  const handleTypeChange = useCallback((value: number) => {
    form.setFieldsValue({ amount: value === 1 ? 1 : 100000 });
  }, []);

  const lowBalance = useMemo(() => {
    if (!lndName) return false;
    const lndNodeModel = lightningNodes[lndName];
    return Number(lndNodeModel?.walletBalance?.confirmed) < TAP_MIN_LND_BALANCE;
  }, [lightningNodes, lndName]);

  const handleSubmit = useCallback(
    (values: {
      assetType: number;
      name: string;
      amount: number;
      enableEmission: boolean;
      finalize: boolean;
      autoFund: boolean;
      decimals: number;
    }) => {
      const { lightning, tap } = network.nodes;
      const node = [...lightning, ...tap].find(node => node.name === nodeName);
      if (!node) return;

      const payload: MintAssetPayload = {
        node: mapToTapd(node),
        assetType: assetType === 1 ? TAP_ASSET_TYPE.COLLECTIBLE : TAP_ASSET_TYPE.NORMAL,
        name: values.name,
        amount: values.amount,
        enableEmission: values.enableEmission,
        finalize: values.finalize,
        autoFund: values.autoFund,
        decimals: assetType === 1 ? 0 : values.decimals,
      };
      mintAssetAsync.execute(payload);
    },
    [network.nodes, nodeName, mintAssetAsync],
  );

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
          amount: 100000,
          enableEmission: false,
          finalize: true,
          autoFund: true,
          decimals: 2,
        }}
        onFinish={handleSubmit}
        disabled={mintAssetAsync.loading}
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
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="amount" label={l('amount')}>
              <InputNumber<number>
                placeholder={l('amountPlaceholder')}
                disabled={mintAssetAsync.loading || assetType === 1}
                style={{ width: '100%' }}
                formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={v => parseFloat(`${v}`.replace(/(undefined|,*)/g, ''))}
                min={1}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="decimals"
              label={l('decimals')}
              help={l('decimalsInfo', {
                example: formatDecimals(amount, decimals),
              })}
              hidden={assetType === 1}
            >
              <Slider
                min={0}
                max={8}
                step={1}
                disabled={mintAssetAsync.loading || assetType === 1}
              />
            </Form.Item>
          </Col>
        </Row>

        {/*
        Hidden until asset groups is fully supported
        <Form.Item name="enableEmission" valuePropName="checked">
          <Checkbox>{l('enableEmission')}</Checkbox>
        </Form.Item> 
        */}

        <Form.Item name="finalize" valuePropName="checked">
          <Checkbox>{l('finalize')}</Checkbox>
        </Form.Item>
        {lowBalance && !autoFund && (
          <Alert type="warning" message={l('lndBalanceError', { lndNode: lndName })} />
        )}
        {lowBalance && (
          <Form.Item name="autoFund" valuePropName="checked">
            <Checkbox>{l('deposit', { selectedFrom: lndName })}</Checkbox>
          </Form.Item>
        )}
      </Form>
    </>
  );

  return (
    <>
      <Modal
        title={l('title', { name: nodeName })}
        open={visible}
        onCancel={() => hideMintAsset()}
        destroyOnClose
        cancelText={l('cancelBtn')}
        okText={l('okBtn')}
        okButtonProps={{
          loading: mintAssetAsync.loading,
          disabled: (lowBalance && !autoFund) || assetName.length === 0,
        }}
        onOk={form.submit}
      >
        {cmp}
      </Modal>
    </>
  );
};

export default MintAssetModal;
