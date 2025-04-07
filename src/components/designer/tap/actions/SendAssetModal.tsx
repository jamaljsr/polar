import React, { useMemo, useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { Alert, Checkbox, Divider, Form, Input, Modal } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { TapdNode } from 'shared/types';
import { TapAddress } from 'lib/tap/types';
import { useStoreActions, useStoreState } from 'store';
import {
  DecodeAddressPayload,
  SendAssetPayload,
  TAP_MIN_LND_BALANCE,
} from 'store/models/tap';
import { Network } from 'types';
import { getTapdNodes } from 'utils/network';
import { ellipseInner } from 'utils/strings';
import { CopyIcon } from 'components/common';
import DetailsList, { DetailValues } from 'components/common/DetailsList';

interface Props {
  network: Network;
}

const SendAssetModal: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation('cmps.designer.tap.actions.SendAssetModal');

  const { notify } = useStoreActions(s => s.app);
  const { visible, nodeName, lndName } = useStoreState(s => s.modals.sendAsset);
  const { hideSendAsset } = useStoreActions(s => s.modals);
  const { nodes: lightningNodes } = useStoreState(s => s.lightning);
  const { sendAsset, decodeAddress } = useStoreActions(s => s.tap);

  const [decodedAddress, setDecodedAddress] = useState<TapAddress & { name?: string }>();
  const [error, setError] = useState<string>();

  const [form] = Form.useForm();
  const autoFund: string = Form.useWatch('autoFund', form);

  const { node } = useMemo(() => {
    const tapNodes = getTapdNodes(network);
    const node = tapNodes.find(node => node.name === nodeName) as TapdNode;
    const otherNodes = tapNodes.filter(node => node.name !== nodeName);
    return { node, otherNodes };
  }, [network.nodes, nodeName]);

  const sendAssetAsync = useAsyncCallback(
    async (values: { address: string; autoFund: boolean }) => {
      try {
        const payload: SendAssetPayload = {
          node,
          address: values.address,
          autoFund: values.autoFund,
        };
        await sendAsset(payload);
        notify({
          message: l('success', {
            amount: decodedAddress?.amount,
            assetName: decodedAddress?.name,
            addr: ellipseInner(payload.address, 6),
          }),
        });
        hideSendAsset();
      } catch (error: any) {
        notify({ message: l('submitError'), error });
      }
    },
  );

  const lowBalance = useMemo(() => {
    if (!lndName) return false;
    const lndNodeModel = lightningNodes[lndName];
    return Number(lndNodeModel?.walletBalance?.confirmed) < TAP_MIN_LND_BALANCE;
  }, [lightningNodes, lndName]);

  const decodeAddressAsync = useAsyncCallback(async (payload: DecodeAddressPayload) => {
    try {
      const addr = await decodeAddress(payload);
      setDecodedAddress(addr);
      setError(undefined);
    } catch (error: any) {
      setDecodedAddress(undefined);
      setError(error.message);
    }
  });

  const handleAddressChange = async (tapAddress: string) => {
    if (tapAddress.length > 0) {
      decodeAddressAsync.execute({ address: tapAddress, node });
    } else {
      setError(undefined);
    }
  };

  const successDescriptionCmp = useMemo(() => {
    const details: DetailValues = [
      {
        label: l('assetName'),
        value: decodedAddress?.name,
      },
      { label: l('type'), value: decodedAddress?.type },
      { label: l('amount'), value: decodedAddress?.amount },
    ];

    return <DetailsList details={details} />;
  }, [decodedAddress]);

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
        message={l('missingAsset', { nodeName: node?.name })}
        description={<DetailsList details={details} />}
      />
    );
  }, [decodedAddress]);

  if (!node) return null;

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
        onFinish={sendAssetAsync.execute}
      >
        <Form.Item
          name="address"
          label={l('address')}
          help={error}
          validateStatus={error ? 'error' : ''}
        >
          <Input.TextArea
            rows={5}
            placeholder={l('address')}
            onChange={e => handleAddressChange(e.target.value)}
            disabled={sendAssetAsync.loading}
          />
        </Form.Item>
        <div>
          {decodedAddress && (
            <>
              <Divider>{l('addressInfo')}</Divider>
              {decodedAddress?.name ? successDescriptionCmp : missingAssetCmp}
            </>
          )}
        </div>
        {lowBalance && !autoFund && (
          <>
            <Alert
              type="warning"
              message={l('lndBalanceError', { lndNode: node.lndName })}
            />
          </>
        )}
        {lowBalance && (
          <Form.Item name="autoFund" valuePropName="checked">
            <Checkbox>{l('deposit', { selectedFrom: node.lndName })}</Checkbox>
          </Form.Item>
        )}
      </Form>
    </>
  );

  return (
    <>
      <Modal
        title={l('title', { name: node.name })}
        open={visible}
        destroyOnClose
        cancelText={l('cancelBtn')}
        okText={l('okBtn')}
        onCancel={() => hideSendAsset()}
        okButtonProps={{
          loading: sendAssetAsync.loading,
          disabled: !decodedAddress,
        }}
        onOk={form.submit}
      >
        {cmp}
      </Modal>
    </>
  );
};

export default SendAssetModal;
