import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import CopyToClipboard from 'react-copy-to-clipboard';
import styled from '@emotion/styled';
import {
  Button,
  Col,
  Collapse,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Result,
  Row,
} from 'antd';
import CollapsePanel from 'antd/lib/collapse/CollapsePanel';
import { usePrefixedTranslation } from 'hooks';
import { Status, TarodNode } from 'shared/types';
import * as PTARO from 'lib/taro/types';
import { useStoreActions, useStoreState } from 'store';
import { NewAddressPayload } from 'store/models/taro';
import { Network } from 'types';
import { ellipseInner } from 'utils/strings';
import { format } from 'utils/units';
import CopyIcon from 'components/common/CopyIcon';
import CopyableInput from 'components/common/form/CopyableInput';
import TaroAssetSelect from 'components/common/form/TaroAssetSelect';
import TaroNodeSelect from 'components/common/form/TaroNodeSelect';

const TaroBalanceSelect = TaroAssetSelect;

const Styled = {
  Spacer: styled.div`
    height: 12px;
  `,
};

interface Props {
  network: Network;
}

const NewAddressModal: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation('cmps.designer.taro.actions.NewAddressModal');

  //app
  const { notify } = useStoreActions(s => s.app);

  //designer actions
  const { syncChart } = useStoreActions(s => s.designer);

  //modal state
  const { visible, nodeName } = useStoreState(s => s.modals.newAddress);
  const { hideNewAddress } = useStoreActions(s => s.modals);

  //taro model
  const { nodes: taroNodes } = useStoreState(s => s.taro);
  const { getNewAddress } = useStoreActions(s => s.taro);

  //component state
  const [selectedTaroNode, setSelectedTaroNode] = useState('');
  const [selectedAmount, setSelectedAmount] = useState('1');
  const [selectedGenesisBootstrapInfo, setSelectedGenesisBootstrapInfo] = useState('');
  const [balances, setBalances] = useState<PTARO.TaroBalance[]>();
  const [selectedBalance, setSelectedBalance] = useState<PTARO.TaroBalance>();
  const [taroAddress, setTaroAddress] = useState('');
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(true);

  //component local variables
  const [form] = Form.useForm();
  const thisTaroNode = network.nodes.taro.find(
    node => node.name === nodeName,
  ) as TarodNode;
  const otherTaroNodes = network.nodes.taro.filter(node => node.name !== nodeName);

  useEffect(() => syncChart(network), []);

  const handleSelectedBalance = (value: number) => {
    if (balances) {
      setSelectedBalance(balances[value]);
      setSelectedGenesisBootstrapInfo(balances[value].genesisBootstrapInfo);
      setSelectedAmount(balances[value].balance);
      form.setFieldsValue({
        genesisBootstrapInfo: balances[value].genesisBootstrapInfo,
        amount: Math.min(parseInt(balances[value].balance), 10),
      });
    }
  };

  const handleGenesisBootstrapInfo = (value: string) => {
    setIsMenuCollapsed(!isMenuCollapsed);
    setSelectedGenesisBootstrapInfo(value);
  };

  //submit
  const newAddressAsync = useAsyncCallback(async (payload: NewAddressPayload) => {
    try {
      const res = await getNewAddress(payload);
      setTaroAddress(res.encoded);
    } catch (error: any) {
      notify({ message: l('submitError'), error });
    }
  });

  const handleSubmit = () => {
    if (selectedAmount && selectedGenesisBootstrapInfo) {
      const payload: NewAddressPayload = {
        node: thisTaroNode,
        genesisBootstrapInfo: selectedGenesisBootstrapInfo,
        amount: selectedAmount,
      };
      newAddressAsync.execute(payload);
    }
  };

  useMemo(() => {
    selectedTaroNode && setBalances(taroNodes[selectedTaroNode]?.balances);
  }, [network.nodes.taro, taroNodes, selectedTaroNode]);

  const handleCopy = () => {
    message.success(l('copied', { address: ellipseInner(taroAddress, 10, 10) }), 2);
    hideNewAddress();
  };

  let cmp: ReactNode;
  if (!taroAddress) {
    cmp = (
      <>
        <Form
          form={form}
          layout="vertical"
          colon={false}
          initialValues={{
            balanceIndex: 0,
            amount: '1',
            node: '',
            genesisBootstrapInfo: '',
          }}
          onFinish={handleSubmit}
        >
          <Form.Item name="genesisBootstrapInfo" label={l('genesisBootstrapInfo')}>
            <Input.TextArea
              rows={5}
              placeholder={l('genesisBootstrapInfo')}
              onChange={e => handleGenesisBootstrapInfo(e.target.value)}
            />
          </Form.Item>
          <Styled.Spacer />
          <Collapse
            collapsible="header"
            onChange={v => {
              setIsMenuCollapsed(!isMenuCollapsed);
            }}
            activeKey={isMenuCollapsed ? [] : ['1']}
          >
            <Collapse.Panel header={l('import')} key="1">
              <Row gutter={10}>
                <Col span={12}>
                  <TaroNodeSelect
                    name="node"
                    networkNodes={otherTaroNodes}
                    nodeStatus={Status.Started}
                    onChange={v => setSelectedTaroNode(v?.valueOf() as string)}
                  />
                </Col>
                <Col span={12}>
                  <TaroBalanceSelect
                    name="balanceName"
                    items={balances}
                    onChange={v => handleSelectedBalance(v?.valueOf() as number)}
                  />
                </Col>
              </Row>
            </Collapse.Panel>
          </Collapse>
          <Styled.Spacer />
          <Form.Item label={l('amount')} name="amount">
            <InputNumber
              onChange={v => setSelectedAmount(v?.valueOf()?.toString() as string)}
              min={'1'}
              max={isMenuCollapsed ? undefined : selectedBalance?.balance}
              disabled={selectedBalance?.type === PTARO.TARO_ASSET_TYPE.COLLECTIBLE}
            />
          </Form.Item>
        </Form>
      </>
    );
  } else {
    cmp = (
      <Result
        status="success"
        title={l('successTitle')}
        subTitle={l('successDesc', {
          assetName: selectedBalance?.name,
          amount: format(`${selectedAmount}`),
        })}
        extra={
          <Form>
            <Form.Item>
              <CopyableInput label="Invoice" value={taroAddress} />
            </Form.Item>
            <Form.Item>
              <CopyToClipboard text={taroAddress} onCopy={handleCopy}>
                <Button type="primary">{l('copyClose')}</Button>
              </CopyToClipboard>
            </Form.Item>
          </Form>
        }
      />
    );
  }

  return (
    <>
      <Modal
        title={l('title', { name: nodeName })}
        open={visible}
        destroyOnClose
        footer={taroAddress ? null : undefined}
        cancelText={l('cancelBtn')}
        okText={l('okBtn')}
        onCancel={() => hideNewAddress()}
        onOk={form.submit}
      >
        {cmp}
      </Modal>
    </>
  );
};

export default NewAddressModal;
