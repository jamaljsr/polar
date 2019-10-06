import React, { useState } from 'react';
import { useAsync } from 'react-async-hook';
import styled from '@emotion/styled';
import { Alert, Form, Icon, Input, Radio } from 'antd';
import { LndNode, Status } from 'types';
import { readHex } from 'utils/files';

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
  const [fileType, setFileType] = useState<string>('paths');
  const [hexValues, setHexValues] = useState<Record<string, string>>({});
  const hexFilesAsync = useAsync(async () => {
    const { tlsCert, adminMacaroon, readonlyMacaroon } = node.paths;
    setHexValues({
      tlsCert: await readHex(tlsCert),
      adminMacaroon: await readHex(adminMacaroon),
      readonlyMacaroon: await readHex(readonlyMacaroon),
    });
  }, [node.paths]);

  if (node.status !== Status.Started) {
    return <>Start the network to view connection information</>;
  }

  const values = fileType === 'paths' ? node.paths : hexValues;

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
        <Styled.RadioGroup
          defaultValue={fileType}
          onChange={e => setFileType(e.target.value)}
        >
          <Radio.Button value="paths">File Paths</Radio.Button>
          <Radio.Button value="hex">HEX Strings</Radio.Button>
        </Styled.RadioGroup>
      </Form.Item>
      {hexFilesAsync.error && (
        <Alert
          type="error"
          closable={false}
          message="Unable to hex encode file contents"
          description={hexFilesAsync.error.message}
        />
      )}
      <Form labelCol={{ span: 12 }} wrapperCol={{ span: 12 }} labelAlign="left">
        <Form.Item label="TLS Cert">
          <Input
            readOnly
            value={values.tlsCert}
            addonAfter={<Icon type="copy" onClick={() => {}} />}
          />
        </Form.Item>
        <Form.Item label="Admin Macaroon">
          <Input
            readOnly
            value={values.adminMacaroon}
            addonAfter={<Icon type="copy" onClick={() => {}} />}
          />
        </Form.Item>
        <Form.Item label="Read-only Macaroon">
          <Input
            readOnly
            value={values.readonlyMacaroon}
            addonAfter={<Icon type="copy" onClick={() => {}} />}
          />
        </Form.Item>
      </Form>
    </>
  );
};

export default ConnectTab;
