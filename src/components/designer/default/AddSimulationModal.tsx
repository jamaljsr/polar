import React from 'react';
import { Modal, Form, Alert, Row, Col, InputNumber } from 'antd';
import { useStoreActions } from 'store';
import { useStoreState } from 'store';
import { usePrefixedTranslation } from 'hooks';
import LightningNodeSelect from 'components/common/form/LightningNodeSelect';
import { Status } from 'shared/types';
import { Network } from 'types';

interface Props {
  network: Network;
}

const AddSimulationModal: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation('cmps.designer.default.AddSimulationModal');

  const { nodes } = useStoreState(s => s.lightning);

  const [form] = Form.useForm();
  const { visible } = useStoreState(s => s.modals.addSimulation);
  const { hideAddSimulation } = useStoreActions(s => s.modals);

  const selectedSource = Form.useWatch<string>('source', form) || '';
  const selectedDestination = Form.useWatch<string>('destination', form) || '';
  const isSameNode = selectedSource === selectedDestination;

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
      }}
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
      >
        {isSameNode && <Alert type="error" message={l('sameNodesWarnMsg')} />}
        <Row gutter={16}>
          <Col span={12}>
            <LightningNodeSelect
              network={network}
              name="source"
              label={l('source')}
              nodeStatus={Status.Started}
              implementation={'LND'}
              nodes={nodes}
            />
          </Col>
          <Col span={12}>
            <LightningNodeSelect
              network={network}
              name="destination"
              label={l('destination')}
              nodeStatus={Status.Started}
              implementation={'LND'}
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
