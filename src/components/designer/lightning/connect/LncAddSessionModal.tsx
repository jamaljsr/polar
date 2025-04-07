import React, { ReactNode } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import CopyToClipboard from 'react-copy-to-clipboard';
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  Result,
  Row,
  Select,
} from 'antd';
import { usePrefixedTranslation } from 'hooks';
import moment from 'moment';
import { LitdNode } from 'shared/types';
import * as PLIT from 'lib/litd/types';
import { useStoreActions, useStoreState } from 'store';
import { Network } from 'types';
import { LNC_MAILBOX_SERVER } from 'utils/constants';
import CopyableInput from 'components/common/form/CopyableInput';

interface FormValues {
  label: string;
  type: PLIT.Session['type'];
  mailboxServerAddr?: string;
  expiresAt: moment.Moment;
}

interface Props {
  network: Network;
}

const LncAddSessionModal: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation(
    'cmps.designer.lightning.connect.LncAddSessionModal',
  );
  const [form] = Form.useForm<FormValues>();
  const { visible, nodeName, label, pairingPhrase } = useStoreState(
    s => s.modals.addLncSession,
  );
  const { showAddLncSession, hideAddLncSession } = useStoreActions(s => s.modals);
  const { addSession } = useStoreActions(s => s.lit);
  const { notify } = useStoreActions(s => s.app);

  const addSessionAsync = useAsyncCallback(async (values: FormValues) => {
    try {
      const { lightning } = network.nodes;
      const node = lightning
        .filter(n => n.implementation === 'litd')
        .find(n => n.name === nodeName) as LitdNode;
      if (!node) return;

      const { label, type, mailboxServerAddr, expiresAt } = values;
      const { pairingPhrase } = await addSession({
        node,
        label,
        type,
        mailboxServerAddr: mailboxServerAddr || LNC_MAILBOX_SERVER,
        expiresAt: expiresAt.valueOf(), // milli-secs since epoch
      });
      await showAddLncSession({ label, pairingPhrase });
    } catch (error: any) {
      notify({ message: l('submitError'), error });
    }
  });

  const handleCopy = () => {
    message.success(l('copied'), 2);
    hideAddLncSession();
  };

  let cmp: ReactNode;
  if (!pairingPhrase) {
    cmp = (
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        colon={false}
        initialValues={{
          type: 'Admin',
          expiresAt: moment().add(90, 'day'),
        }}
        onFinish={addSessionAsync.execute}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="label"
              label={l('label')}
              rules={[{ required: true, message: l('cmps.forms.required') }]}
            >
              <Input placeholder={l('labelSample')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="type"
              label={l('type')}
              rules={[{ required: true, message: l('cmps.forms.required') }]}
            >
              <Select>
                <Select.Option value="Admin">Admin</Select.Option>
                <Select.Option value="Read Only">Read Only</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="expiresAt"
              label={l('expiresAt')}
              rules={[{ required: true, message: l('cmps.forms.required') }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="mailboxServerAddr" label={l('mailboxServerAddr')}>
              <Input placeholder={LNC_MAILBOX_SERVER} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    );
  } else {
    cmp = (
      <Result
        status="success"
        title={l('successTitle')}
        subTitle={l('successDesc', { nodeName, label })}
        extra={
          <Form>
            <Form.Item>
              <CopyableInput label="Invoice" value={pairingPhrase} />
            </Form.Item>
            <Form.Item>
              <CopyToClipboard text={pairingPhrase} onCopy={handleCopy}>
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
        title={l('title')}
        open={visible}
        onCancel={() => hideAddLncSession()}
        destroyOnClose
        footer={pairingPhrase ? null : undefined}
        cancelText={l('cancelBtn')}
        okText={l('okBtn')}
        okButtonProps={{
          loading: addSessionAsync.loading,
        }}
        onOk={form.submit}
      >
        {cmp}
      </Modal>
    </>
  );
};

export default LncAddSessionModal;
