import React, { useState } from 'react';
import { useAsync } from 'react-async-hook';
import styled from '@emotion/styled';
import { Alert, Form, Radio } from 'antd';
import { LndNode, Status } from 'types';
import { readHex } from 'utils/files';
import CopyableInput from 'components/common/form/CopyableInput';

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
    return <>Start the network to view connection info</>;
  }

  const values = fileType === 'paths' ? node.paths : hexValues;

  return (
    <>
      <Form labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} labelAlign="left">
        <Form.Item label="GRPC Host">
          <CopyableInput value={`127.0.0.1:${node.ports.grpc}`} label="GRPC Host" />
        </Form.Item>
        <Form.Item label="REST Host">
          <CopyableInput
            value={`https://127.0.0.1:${node.ports.rest}`}
            label="REST Host"
          />
        </Form.Item>
      </Form>
      <Form.Item>
        <Styled.RadioGroup
          name="fileType"
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
      <Form>
        <Form.Item label="TLS Cert">
          <CopyableInput value={values.tlsCert} label="TLS Cert" />
        </Form.Item>
        <Form.Item label="Admin Macaroon">
          <CopyableInput value={values.adminMacaroon} label="Admin Macaroon" />
        </Form.Item>
        <Form.Item label="Read-only Macaroon">
          <CopyableInput value={values.readonlyMacaroon} label="Read-only Macaroon" />
        </Form.Item>
      </Form>
    </>
  );
};

export default ConnectTab;
