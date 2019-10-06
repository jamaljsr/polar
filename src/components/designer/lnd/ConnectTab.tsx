import React from 'react';
import styled from '@emotion/styled';
import { Form, Icon, Input, Radio } from 'antd';
import { LndNode, Status } from 'types';

const Styled = {
  RadioGroup: styled(Radio.Group)`
    display: flex;
    justify-content: center;
  `,
};

interface Props {
  node: LndNode;
}

const ConnectTab: React.FC<Props> = ({ node }) => {
  if (node.status !== Status.Started) {
    return <>Start the network to view connection information</>;
  }

  return (
    <>
      <Form labelCol={{ span: 10 }} wrapperCol={{ span: 14 }} labelAlign="left">
        <Form.Item label="GRPC Host">
          <Input
            readOnly
            value={`127.0.0.1:${node.ports.grpc}`}
            addonAfter={<Icon type="copy" onClick={() => {}} />}
          />
        </Form.Item>
        <Form.Item label="REST Host">
          <Input
            readOnly
            value={`127.0.0.1:${node.ports.rest}`}
            addonAfter={<Icon type="copy" onClick={() => {}} />}
          />
        </Form.Item>
      </Form>
      <Form.Item>
        <Styled.RadioGroup defaultValue="paths" style={{ margin: 'auto' }}>
          <Radio.Button value="paths">File Paths</Radio.Button>
          <Radio.Button value="hex">HEX Strings</Radio.Button>
        </Styled.RadioGroup>
      </Form.Item>
      <Form labelCol={{ span: 12 }} wrapperCol={{ span: 12 }} labelAlign="left">
        <Form.Item label="TLS Cert">
          <Input
            readOnly
            value={node.tlsPath}
            addonAfter={<Icon type="copy" onClick={() => {}} />}
          />
        </Form.Item>
        <Form.Item label="Admin Macaroon">
          <Input
            readOnly
            value={node.macaroonPath}
            addonAfter={<Icon type="copy" onClick={() => {}} />}
          />
        </Form.Item>
        <Form.Item label="Read-only Macaroon">
          <Input
            readOnly
            value={node.macaroonPath}
            addonAfter={<Icon type="copy" onClick={() => {}} />}
          />
        </Form.Item>
      </Form>
    </>
  );
};

export default ConnectTab;
