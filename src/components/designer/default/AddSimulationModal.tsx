import React from 'react';
import { Modal, Form, Alert, Row, Col, InputNumber } from 'antd';
import { useStoreActions } from 'store';
import { useStoreState } from 'store';
import { usePrefixedTranslation } from 'hooks';
import LightningNodeSelect from 'components/common/form/LightningNodeSelect';
import { LightningNode, Status } from 'shared/types';
import { Network } from 'types';
import { useAsyncCallback } from 'react-async-hook';

interface Props {
  network: Network;
}

interface FormValues {
  source: string;
  destination: string;
  intervalSecs: number;
  amountMsat: number;
}

interface SimulationArgs {
  source: LightningNode;
  destination: LightningNode;
  intervalSecs: number;
  amountMsat: number;
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

    const { intervalSecs, amountMsat } = values;
    const sim: SimulationArgs = {
      source,
      destination,
      intervalSecs,
      amountMsat,
    };

    await addSimulation({
      networkId: network.id,
      ...sim,
      status: Status.Stopped,
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
          amountMsat: 1000,
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
            <Form.Item
              name="intervalSecs"
              label={l('interval')}
              rules={[{ required: true, message: l('cmps.forms.required') }]}
            >
              <InputNumber<number>
                formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={v => parseInt(`${v}`.replace(/(undefined|,*)/g, ''))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="amountMsat"
              label={l('amount')}
              rules={[{ required: true, message: l('cmps.forms.required') }]}
            >
              <InputNumber<number>
                formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={v => parseInt(`${v}`.replace(/(undefined|,*)/g, ''))}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default AddSimulationModal;
