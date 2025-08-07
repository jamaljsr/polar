import React, { ReactNode, useState } from 'react';
import { Modal, Form, Alert, Row, Col, InputNumber, Button, Empty } from 'antd';
import { useStoreActions } from 'store';
import { useStoreState } from 'store';
import { usePrefixedTranslation } from 'hooks';
import LightningNodeSelect from 'components/common/form/LightningNodeSelect';
import { LightningNode, Status } from 'shared/types';
import { Network } from 'types';
import { useAsyncCallback } from 'react-async-hook';
import { ArrowRightOutlined, CloseCircleOutlined, PlusOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';

interface Props {
  network: Network;
}

const Styled = {
  ActivityContainer: styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
  `,
  ActivityWrapper: styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-height: 100px;
    overflow-y: auto;
    padding: 10px 15px;
    margin-top: 20px;
    margin-bottom: 20px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    font-weight: bold;
  `,
  Activity: styled.div`
    display: flex;
    align-items: center;
    justify-content: start;
    column-gap: 15px;
    width: 100%;
  `,
  ActivityDelete: styled(Button)`
    margin-left: auto;
  `,
};

interface SimulationArgs {
  source: LightningNode;
  destination: LightningNode;
  intervalSecs: number;
  amountMsat: number;
}

const AddSimulationModal: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation('cmps.designer.default.AddSimulationModal');

  const [activities, setActivities] = useState<SimulationArgs[]>([]);

  const { nodes } = useStoreState(s => s.lightning);

  const [form] = Form.useForm();
  const { visible } = useStoreState(s => s.modals.addSimulation);
  const { hideAddSimulation } = useStoreActions(s => s.modals);
  const { addSimulation } = useStoreActions(s => s.network);

  const { notify } = useStoreActions(s => s.app);

  const selectedSource = Form.useWatch<string>('source', form) || '';
  const selectedDestination = Form.useWatch<string>('destination', form) || '';
  const isSameNode = selectedSource === selectedDestination;

  const intervalSecs = Form.useWatch<number>('intervalSecs', form) || 10;
  const amountMsat = Form.useWatch<number>('amountMsat', form) || 1000;

  const addSimulationAsync = useAsyncCallback(async () => {
    await addSimulation({
      networkId: network.id,
      activity: activities,
      status: Status.Stopped,
    });

    hideAddSimulation();
  });

  const addActivity = () => {
    const { lightning } = network.nodes;
    const source = lightning.find(n => n.name === selectedSource);
    const destination = lightning.find(n => n.name === selectedDestination);

    if (!source || !destination) {
      notify({ message: l('sourceOrDestinationNotFound') });
      return;
    }

    setActivities([
      ...activities,
      {
        source,
        destination,
        intervalSecs,
        amountMsat,
      },
    ]);
  };

  const removeActivity = (index: number) => {
    setActivities(activities.filter((_, i) => i !== index));
  };

  let activityCmp: ReactNode;
  if (activities.length > 0) {
    activityCmp = (
      <Styled.ActivityWrapper>
        {activities.map((activity, index) => (
          <Styled.Activity key={index}>
            <span>{activity.source?.name}</span>
            <ArrowRightOutlined />
            <span>{activity.destination?.name}</span>
            <span>
              ({activity.amountMsat} msats every {activity.intervalSecs} seconds)
            </span>
            <Styled.ActivityDelete
              type="text"
              icon={<CloseCircleOutlined />}
              onClick={() => removeActivity(index)}
              role="deleteActivity"
              size="small"
            />
          </Styled.Activity>
        ))}
      </Styled.ActivityWrapper>
    );
  } else {
    activityCmp = (
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={l('emptyMsg')}></Empty>
    );
  }

  return (
    <Modal
      title={l('title')}
      open={visible}
      onCancel={() => hideAddSimulation()}
      destroyOnClose
      cancelText={l('cancelBtn')}
      okText={l('createBtn')}
      okButtonProps={{
        disabled: isSameNode || activities.length === 0,
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
        <Styled.ActivityContainer>{activityCmp}</Styled.ActivityContainer>
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
          <Col span={12}>
            <Form.Item name="sim">
              <Button type="ghost" icon={<PlusOutlined />} onClick={addActivity}>
                {l('addActivityBtn')}
              </Button>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default AddSimulationModal;
