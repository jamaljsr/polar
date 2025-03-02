import React from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { Alert, Col, Form, InputNumber, Modal, Row, Slider } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { LightningNode, Status } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { Network } from 'types';
import LightningNodeSelect from 'components/common/form/LightningNodeSelect';

interface FormValues {
  source: string;
  destination: string;
  intervalSecs: number;
  amountMsat: number;
}

interface SimulationActivityArgs {
  source: LightningNode;
  destination: LightningNode;
  intervalSecs: number;
  amountMsat: number;
}

interface Props {
  network: Network;
}

const SimLnAddActivityModal: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation('cmps.designer.SimLnAddActivityModal');

  const { nodes } = useStoreState(s => s.lightning);

  const [form] = Form.useForm();
  const { visible, source, destination } = useStoreState(s => s.modals.addSimLnActivity);
  const { hideAddSimLnActivity } = useStoreActions(s => s.modals);
  const { addSimulationActivity } = useStoreActions(s => s.network);

  const { notify } = useStoreActions(s => s.app);

  const selectedSource = Form.useWatch<string>('source', form) || '';
  const selectedDestination = Form.useWatch<string>('destination', form) || '';

  const sameNode = selectedSource === selectedDestination;

  const addSimLnActivityAsync = useAsyncCallback(async (values: FormValues) => {
    try {
      const { lightning } = network.nodes;
      const sourceNode = lightning.find(n => n.name === values.source);
      const destinationNode = lightning.find(n => n.name === values.destination);
      if (!sourceNode || !destinationNode) return;

      const { intervalSecs, amountMsat } = values;
      const activity: SimulationActivityArgs = {
        source: sourceNode,
        destination: destinationNode,
        amountMsat: amountMsat,
        intervalSecs: +intervalSecs,
      };

      await addSimulationActivity({ networkId: network.id, ...activity });
      // reset form
      hideAddSimLnActivity();
    } catch (error: any) {
      notify({ message: l('submitError'), error });
    }
  });

  return (
    <>
      <Modal
        title={l('title')}
        open={visible}
        onCancel={() => hideAddSimLnActivity()}
        destroyOnClose
        cancelText={l('cancelBtn')}
        okText={l('okBtn')}
        okButtonProps={{
          loading: addSimLnActivityAsync.loading,
          disabled: sameNode,
        }}
        onOk={form.submit}
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          colon={false}
          onFinish={addSimLnActivityAsync.execute}
          disabled={addSimLnActivityAsync.loading}
        >
          {sameNode && <Alert type="error" message={l('sameNodesWarnMsg')} />}
          <Row gutter={16}>
            <Col span={12}>
              <LightningNodeSelect
                network={network}
                name="source"
                label={l('source')}
                nodeStatus={Status.Started}
                implementations={['LND', 'c-lightning']}
                initialValue={source}
                nodes={nodes}
              />
            </Col>
            <Col span={12}>
              <LightningNodeSelect
                network={network}
                name="destination"
                label={l('destination')}
                nodeStatus={Status.Started}
                implementations={['LND', 'c-lightning']}
                initialValue={destination}
                nodes={nodes}
              />
            </Col>
          </Row>

          <Form.Item
            name="intervalSecs"
            label={l('intervalSecs')}
            rules={[{ required: true, message: l('cmps.forms.required') }]}
          >
            <Row style={{ width: '100%' }}>
              <Col span={15}>
                <Slider
                  min={1}
                  max={100}
                  defaultValue={10}
                  onAfterChange={value => form.setFieldsValue({ intervalSecs: value })}
                />
              </Col>
              <Col span={4}>
                <InputNumber<number>
                  formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={v => parseInt(`${v}`.replace(/(undefined|,*)/g, ''))}
                  style={{ margin: '0 16px' }}
                  min={1}
                  defaultValue={10}
                  onChange={value => form.setFieldsValue({ intervalSecs: value })}
                />
              </Col>
            </Row>
          </Form.Item>
          <Form.Item name="amountMsat" label={l('amountMsat')} initialValue={1000}>
            <InputNumber<number>
              formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={v => parseInt(`${v}`.replace(/(undefined|,*)/g, ''))}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default SimLnAddActivityModal;
