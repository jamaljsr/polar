import React from 'react';
import { Modal, Form, Alert, Row, Col, InputNumber } from 'antd';
import { useStoreActions } from 'store';
import { useStoreState } from 'store';
import { usePrefixedTranslation } from 'hooks';
import LightningNodeSelect from 'components/common/form/LightningNodeSelect';
import { Status } from 'shared/types';
import styled from '@emotion/styled';
import { Activity, Network } from 'types';
import { useAsyncCallback } from 'react-async-hook';

interface Props {
  network: Network;
}

const Styled = {
  FormItem: styled(Form.Item)`
    width: 100%;
  `,
  InputNumber: styled(InputNumber)`
    width: 100%;
  `,
};
interface FormValues {
  source: string;
  destination: string;
  intervalSecs: number;
  amountSat: number;
}

const AddSimulationModal: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation('cmps.designer.default.AddSimulationModal');

  const { nodes } = useStoreState(s => s.lightning);

  const [form] = Form.useForm();
  const { visible } = useStoreState(s => s.modals.addSimulation);
  const { hideAddSimulation } = useStoreActions(s => s.modals);
  const { addSimulation } = useStoreActions(s => s.network);

  const { notify } = useStoreActions(s => s.app);

  const selectedSource = Form.useWatch<string>('source', form) || '';
  const selectedDestination = Form.useWatch<string>('destination', form) || '';
  const isSameNode = selectedSource === selectedDestination;

  const addSimulationAsync = useAsyncCallback(async (values: FormValues) => {
    const { lightning } = network.nodes;
    const source = lightning.find(n => n.name === values.source);
    const destination = lightning.find(n => n.name === values.destination);

    if (!source || !destination) {
      notify({ message: l('sourceOrDestinationNotFound') });
      return;
    }

    const { intervalSecs, amountSat } = values;
    const id = network.simulation?.activity.length
      ? Math.max(...network.simulation.activity.map(a => a.id)) + 1
      : 0;
    const activity: Activity = {
      id,
      source: source.name,
      destination: destination.name,
      intervalSecs,
      amountMsat: amountSat * 1000,
    };

    await addSimulation({
      networkId: network.id,
      simulation: {
        activity: [activity],
        status: Status.Stopped,
      },
    });

    hideAddSimulation();
  });

  return (
    <Modal
      title={l('title')}
      open={visible}
      onCancel={() => hideAddSimulation()}
      destroyOnClose
      cancelText={l('cancelBtn')}
      okText={l('createBtn')}
      okButtonProps={{
        disabled: isSameNode,
        loading: addSimulationAsync.loading,
      }}
      onOk={form.submit}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        colon={false}
        initialValues={{
          source: 'alice',
          destination: 'bob',
          amountSat: 1000,
          intervalSecs: 10,
        }}
        onFinish={addSimulationAsync.execute}
        disabled={addSimulationAsync.loading}
      >
        {isSameNode && <Alert type="error" message={l('sameNodesWarnMsg')} />}
        <Row gutter={16}>
          <Col span={12}>
            <LightningNodeSelect
              network={network}
              name="source"
              label={l('source')}
              nodeStatus={Status.Started}
              implementation={['LND', 'eclair', 'c-lightning']}
              nodes={nodes}
            />
          </Col>
          <Col span={12}>
            <LightningNodeSelect
              network={network}
              name="destination"
              label={l('destination')}
              nodeStatus={Status.Started}
              implementation={['LND', 'eclair', 'c-lightning']}
              nodes={nodes}
            />
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Styled.FormItem
              name="intervalSecs"
              label={l('interval')}
              rules={[{ required: true, message: l('cmps.forms.required') }]}
            >
              <Styled.InputNumber
                formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={v => parseInt(`${v}`.replace(/(undefined|,*)/g, ''))}
              />
            </Styled.FormItem>
          </Col>
          <Col span={12}>
            <Styled.FormItem
              name="amountSat"
              label={l('amount')}
              rules={[{ required: true, message: l('cmps.forms.required') }]}
            >
              <Styled.InputNumber
                formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={v => parseInt(`${v}`.replace(/(undefined|,*)/g, ''))}
              />
            </Styled.FormItem>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default AddSimulationModal;
