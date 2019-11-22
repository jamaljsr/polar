import React, { ReactNode, useState } from 'react';
import styled from '@emotion/styled';
import { Icon, Radio } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { LndNode, Status } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { ellipseInner } from 'utils/strings';
import CopyIcon from 'components/common/CopyIcon';
import DetailsList, { DetailValues } from 'components/common/DetailsList';
import { EncodedStrings, FilePaths, LndConnect } from './connect';

const Styled = {
  RadioGroup: styled(Radio.Group)`
    display: flex;
    justify-content: center;
    font-size: 12px;
    margin-bottom: 20px;
  `,
  Link: styled.a`
    margin-left: 10px;
    color: inherit;
    &:hover {
      opacity: 1;
    }
  `,
  Icon: styled(Icon)`
    margin-left: 5px;
    color: #aaa;
  `,
};

interface Props {
  node: LndNode;
}

const ConnectTab: React.FC<Props> = ({ node }) => {
  const { l } = usePrefixedTranslation('cmps.designer.lnd.ConnectTab');
  const [authType, setAuthType] = useState<string>('paths');
  const { openInBrowser } = useStoreActions(s => s.app);
  let lnUrl = '';
  const nodeState = useStoreState(s => s.lnd.nodes[node.name]);
  if (nodeState && nodeState.info) {
    lnUrl = nodeState.info.rpcUrl;
  }

  if (node.status !== Status.Started) {
    return <>{l('notStarted')}</>;
  }

  const grpcHost = `127.0.0.1:${node.ports.grpc}`;
  const restHost = `https://127.0.0.1:${node.ports.rest}`;
  const hosts: DetailValues = [
    [l('grpcHost'), grpcHost, grpcHost],
    [l('restHost'), restHost, restHost],
    [l('p2pLnUrl'), lnUrl, ellipseInner(lnUrl, 3, 19)],
  ].map(([label, value, text]) => ({
    label,
    value: <CopyIcon label={label} value={value} text={text} />,
  }));
  hosts.push({
    label: 'API Docs',
    value: (
      <>
        <Styled.Link onClick={() => openInBrowser('https://api.lightning.community/')}>
          GRPC
        </Styled.Link>
        <Styled.Link
          onClick={() => openInBrowser('https://api.lightning.community/rest/')}
        >
          REST
        </Styled.Link>
        <Styled.Icon type="book" />
      </>
    ),
  });

  const authCmps: Record<string, ReactNode> = {
    paths: <FilePaths node={node} />,
    hex: <EncodedStrings node={node} encoding="hex" />,
    base64: <EncodedStrings node={node} encoding="base64" />,
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
        <Radio.Button value="paths">{l('filePaths')}</Radio.Button>
        <Radio.Button value="hex">{l('hexStrings')}</Radio.Button>
        <Radio.Button value="base64">{l('base64Strings')}</Radio.Button>
        <Radio.Button value="lndc">{l('lndConnect')}</Radio.Button>
      </Styled.RadioGroup>
      {authCmps[authType]}
    </>
  );
};

export default ConnectTab;
