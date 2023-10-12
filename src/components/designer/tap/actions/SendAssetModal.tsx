import React, { useEffect, useMemo, useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { Alert, Checkbox, Divider, Form, Input, Modal } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { LightningNode, TapdNode } from 'shared/types';
import { TapAddress, TapAsset } from 'lib/tap/types';
import { useStoreActions, useStoreState } from 'store';
import {
  DecodeAddressPayload,
  SendAssetPayload,
  TAP_MIN_LND_BALANCE,
} from 'store/models/tap';
import { Network } from 'types';
import { ellipseInner } from 'utils/strings';
import { CopyIcon } from 'components/common';
import DetailsList, { DetailValues } from 'components/common/DetailsList';

interface Props {
  network: Network;
}

const SendAssetModal: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation('cmps.designer.tap.actions.SendAssetModal');

  //app
  const { notify } = useStoreActions(s => s.app);

  //modal visibility
  const { visible, nodeName } = useStoreState(s => s.modals.sendAsset);
  const { hideSendAsset } = useStoreActions(s => s.modals);

  //component state
  const [isLNDBalanceLow, setIsLNDBalanceLow] = useState<boolean>(false);
  const [autoDepositFunds, setAutoDepositFunds] = useState<boolean>(false);
  const [decodedAddress, setDecodedAddress] = useState<TapAddress>();
  const [assetName, setAssetName] = useState<string>();
  const [error, setError] = useState<boolean>(false);

  //store model
  const { nodes: lightningNodes } = useStoreState(s => s.lightning);
  const { getWalletBalance } = useStoreActions(s => s.lightning);
  const { nodes: tapNodes } = useStoreState(s => s.tap);
  const { sendAsset, decodeAddress } = useStoreActions(s => s.tap);

  //component local variables
  const [form] = Form.useForm();
  const thisTapNode: TapdNode = network.nodes.tap.find(
    node => node.name === nodeName,
  ) as TapdNode;

  const assets: TapAsset[] = tapNodes[thisTapNode.name].assets || [];

  const sendAssetAsync = useAsyncCallback(async (payload: SendAssetPayload) => {
    try {
      await sendAsset(payload);
      notify({
        message: l('success', {
          amount: decodedAddress?.amount,
          assetName,
          addr: ellipseInner(payload.address, 6),
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
      n => n.name === thisTapNode?.lndName,
    ) as LightningNode;
    getWalletBalance(lndNode);
  }, []);

  useMemo(() => {
    const lndNodeModel = lightningNodes[thisTapNode?.lndName];
    lndNodeModel &&
      setIsLNDBalanceLow(
        Number(lndNodeModel.walletBalance?.confirmed) < TAP_MIN_LND_BALANCE * 2,
      );
  }, [network.nodes.lightning, lightningNodes]);

  const handleSubmit = (values: { address: string; autoFund: boolean }) => {
    const payload: SendAssetPayload = {
      node: thisTapNode,
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

  const handleAddress = async (tapAddress: string) => {
    if (tapAddress.length > 0) {
      decodeAddressAsync.execute({ address: tapAddress, node: thisTapNode });
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
  }, [decodedAddress, tapNodes]);

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
        message={l('missingAsset', { nodeName: thisTapNode?.name })}
        description={<DetailsList details={details} />}
      />
    );
  }, [decodedAddress, tapNodes]);

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
            disabled={sendAssetAsync.loading}
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
              message={l('lndBalanceError', { lndNode: thisTapNode?.lndName })}
            />
          </>
        )}
        {isLNDBalanceLow && (
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
