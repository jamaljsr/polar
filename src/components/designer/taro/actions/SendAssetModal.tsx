import React, { useEffect, useMemo, useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { Alert, Checkbox, Divider, Form, Input, Modal } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { LightningNode, TarodNode } from 'shared/types';
import { TaroAddress, TaroAsset } from 'lib/taro/types';
import { useStoreActions, useStoreState } from 'store';
import {
  DecodeAddressPayload,
  SendAssetPayload,
  TARO_MIN_LND_BALANCE,
} from 'store/models/taro';
import { Network } from 'types';
import { ellipseInner } from 'utils/strings';
import { CopyIcon } from 'components/common';
import DetailsList, { DetailValues } from 'components/common/DetailsList';

interface Props {
  network: Network;
}

const SendAssetModal: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation('cmps.designer.taro.actions.SendAssetModal');

  //app
  const { notify } = useStoreActions(s => s.app);

  //modal visibility
  const { visible, nodeName } = useStoreState(s => s.modals.sendAsset);
  const { hideSendAsset } = useStoreActions(s => s.modals);

  //component state
  const [isLNDBalanceLow, setIsLNDBalanceLow] = useState<boolean>(false);
  const [autoDepositFunds, setAutoDepositFunds] = useState<boolean>(false);
  const [decodedAddress, setDecodedAddress] = useState<TaroAddress>();
  const [assetName, setAssetName] = useState<string>();
  const [error, setError] = useState<boolean>(false);

  //store model
  const { nodes: lightningNodes } = useStoreState(s => s.lightning);
  const { getWalletBalance } = useStoreActions(s => s.lightning);
  const { nodes: taroNodes } = useStoreState(s => s.taro);
  const { sendAsset, decodeAddress } = useStoreActions(s => s.taro);

  //component local variables
  const [form] = Form.useForm();
  const thisTaroNode: TarodNode = network.nodes.taro.find(
    node => node.name === nodeName,
  ) as TarodNode;

  const assets: TaroAsset[] = taroNodes[thisTaroNode.name].assets || [];

  const sendAssetAsync = useAsyncCallback(async (payload: SendAssetPayload) => {
    try {
      await sendAsset(payload);
      notify({
        message: l('success', {
          amount: decodedAddress?.amount,
          assetName,
          internalKey: decodedAddress?.internalKey,
        }),
      });
      hideSendAsset();
    } catch (error: any) {
      notify({ message: l('submitError'), error });
    }
  });
  //When polar is first opened, we need to populate the state with the lightning node data
  useEffect(() => {
    const lndNode: LightningNode = network.nodes.lightning.find(
      n => n.name === thisTaroNode?.lndName,
    ) as LightningNode;
    getWalletBalance(lndNode);
  }, []);

  useMemo(() => {
    const lndNodeModel = lightningNodes[thisTaroNode?.lndName];
    lndNodeModel &&
      setIsLNDBalanceLow(
        Number(lndNodeModel.walletBalance?.confirmed) < TARO_MIN_LND_BALANCE * 2,
      );
  }, [network.nodes.lightning, lightningNodes]);

  const handleSubmit = (values: { address: string; autoFund: boolean }) => {
    const payload: SendAssetPayload = {
      node: thisTaroNode,
      address: values.address,
      autoFund: values.autoFund,
    };
    sendAssetAsync.execute(payload);
  };

  const decodeAddressAsync = useAsyncCallback(async (payload: DecodeAddressPayload) => {
    try {
      const res = await decodeAddress(payload);
      const assetName = assets.find(asset => asset.id === res.id);
      setAssetName(assetName?.name);
      setDecodedAddress(res);
      setError(false);
    } catch (error: any) {
      setAssetName(undefined);
      setDecodedAddress(undefined);
      setError(true);
    }
  });

  const handleAddress = async (taroAddress: string) => {
    if (taroAddress.length > 0) {
      decodeAddressAsync.execute({ address: taroAddress, node: thisTaroNode });
    } else {
      setError(false);
    }
  };

  const successDescriptionCmp = useMemo(() => {
    const details: DetailValues = [
      {
        label: l('assetName'),
        value: assetName,
      },
      { label: l('type'), value: decodedAddress?.type },
      { label: l('amount'), value: decodedAddress?.amount },
    ];

    return <DetailsList details={details} />;
  }, [decodedAddress, taroNodes]);

  const missingAssetCmp = useMemo(() => {
    const details = [
      {
        label: l('id'),
        value: (
          <CopyIcon
            value={decodedAddress?.id as string}
            text={ellipseInner(decodedAddress?.id as string, 10, 10)}
          />
        ),
      },
    ];
    return (
      <Alert
        type="error"
        message={l('missingAsset', { nodeName: thisTaroNode?.name })}
        description={<DetailsList details={details} />}
      />
    );
  }, [decodedAddress, taroNodes]);

  const cmp = (
    <>
      <Form
        form={form}
        layout="vertical"
        colon={false}
        initialValues={{
          balanceIndex: 0,
          autoFund: false,
        }}
        onFinish={handleSubmit}
      >
        <Form.Item name="address" label={l('address')} help={error && l('decodingError')}>
          <Input.TextArea
            rows={5}
            status={error ? 'error' : ''}
            placeholder={l('address')}
            onChange={e => handleAddress(e.target.value)}
          />
        </Form.Item>
        <div>
          {decodedAddress && (
            <>
              <Divider>{l('addressInfo')}</Divider>
              {assetName ? successDescriptionCmp : missingAssetCmp}
            </>
          )}
        </div>
        {isLNDBalanceLow && !autoDepositFunds && (
          <>
            <Alert
              type="warning"
              message={l('lndBalanceError', { lndNode: thisTaroNode?.lndName })}
            />
          </>
        )}
        {isLNDBalanceLow && (
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
        destroyOnClose
        cancelText={l('cancelBtn')}
        okText={l('okBtn')}
        onCancel={() => hideSendAsset()}
        okButtonProps={{
          loading: sendAssetAsync.loading,
          disabled: !decodedAddress || (decodedAddress && !assetName),
        }}
        onOk={form.submit}
      >
        {cmp}
      </Modal>
    </>
  );
};

export default SendAssetModal;
