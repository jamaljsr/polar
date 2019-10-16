import React, { ReactNode, useState } from 'react';
import styled from '@emotion/styled';
import { Radio } from 'antd';
import { useStoreState } from 'store';
import { LndNode, Status } from 'types';
import { ellipseInner } from 'utils/strings';
import CopyIcon from 'components/common/CopyIcon';
import DetailsList, { DetailValues } from 'components/common/DetailsList';
import { FilePaths, HexStrings, LndConnect } from './connect';

const Styled = {
  RadioGroup: styled(Radio.Group)`
    display: flex;
    justify-content: center;
    font-size: 12px;
    margin-bottom: 20px;
  `,
};

interface Props {
  node: LndNode;
}

const ConnectTab: React.FC<Props> = ({ node }) => {
  const [authType, setAuthType] = useState<string>('paths');
  let lnUrl = '';
  const nodeState = useStoreState(s => s.lnd.nodes[node.name]);
  if (nodeState && nodeState.info) {
    lnUrl = nodeState.info.uris[0];
  }

  if (node.status !== Status.Started) {
    return <>Node needs to be started to view connection info</>;
  }

  const grpcHost = `127.0.0.1:${node.ports.grpc}`;
  const restHost = `https://127.0.0.1:${node.ports.rest}`;
  const hosts: DetailValues = [
    ['GRPC Host', grpcHost, grpcHost],
    ['REST Host', restHost, restHost],
    ['P2P LN Url', lnUrl, ellipseInner(lnUrl, 3, 19)],
  ].map(([label, value, text]) => ({
    label,
    value: <CopyIcon label={label} value={value} text={text} />,
  }));

  const authCmps: Record<string, ReactNode> = {
    paths: <FilePaths node={node} />,
    hex: <HexStrings node={node} />,
    lndc: <LndConnect node={node} />,
  };

  return (
    <>
      <DetailsList details={hosts} />
      <Styled.RadioGroup
        name="authType"
        defaultValue={authType}
        size="small"
        onChange={e => setAuthType(e.target.value)}
      >
        <Radio.Button value="paths">File Paths</Radio.Button>
        <Radio.Button value="hex">HEX Strings</Radio.Button>
        <Radio.Button value="lndc">LND Connect</Radio.Button>
      </Styled.RadioGroup>
      {authCmps[authType]}
    </>
  );
};

export default ConnectTab;
