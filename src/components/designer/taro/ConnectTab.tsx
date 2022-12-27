import React, { ReactNode, useMemo, useState } from 'react';
import { BookOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Radio, Tooltip } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { Status, TarodNode, TaroNode } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import CopyIcon from 'components/common/CopyIcon';
import DetailsList, { DetailValues } from 'components/common/DetailsList';
import { EncodedStrings, FilePaths } from 'components/designer/lightning/connect';

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
  BookIcon: styled(BookOutlined)`
    margin-left: 5px;
    color: #aaa;
  `,
};

export interface ConnectionInfo {
  restUrl: string;
  grpcUrl: string;
  apiDocsUrl: string;
  credentials: {
    admin?: string;
    cert?: string;
  };
}

interface Props {
  node: TaroNode;
}

const ConnectTab: React.FC<Props> = ({ node }) => {
  const { l } = usePrefixedTranslation('cmps.designer.taro.ConnectTab');
  const [authType, setAuthType] = useState<string>('paths');
  const { openInBrowser } = useStoreActions(s => s.app);
  const nodeState = useStoreState(s => s.lightning.nodes[node.name]);
  const pubkey = nodeState && nodeState.info ? nodeState.info.pubkey : '';

  const info = useMemo((): ConnectionInfo => {
    if (node.status === Status.Started) {
      if (node.implementation === 'tarod') {
        const lnd = node as TarodNode;
        return {
          restUrl: `https://127.0.0.1:${lnd.ports.rest}`,
          grpcUrl: `127.0.0.1:${lnd.ports.grpc}`,
          apiDocsUrl: 'https://lightning.engineering/api-docs/api/taro/',
          credentials: {
            admin: lnd.paths.adminMacaroon,
            cert: lnd.paths.tlsCert,
          },
        };
      }
    }

    return {
      restUrl: '',
      grpcUrl: '',
      apiDocsUrl: '',
      credentials: {},
    } as ConnectionInfo;
  }, [node, pubkey]);

  if (node.status !== Status.Started) {
    return <>{l('notStarted')}</>;
  }

  const { restUrl, grpcUrl, credentials } = info;
  const hosts: DetailValues = [
    [l('grpcHost'), grpcUrl, grpcUrl],
    [l('restHost'), restUrl, restUrl],
  ]
    .filter(h => !!h[1]) // exclude empty values
    .map(([label, value, text]) => ({
      label,
      value: <CopyIcon label={label} value={value as string} text={text} />,
    }));
  hosts.push({
    label: l('apiDocs'),
    value: (
      <>
        <Tooltip title={info.apiDocsUrl}>
          <Styled.Link onClick={() => openInBrowser(info.apiDocsUrl)}>
            GRPC &amp; REST
          </Styled.Link>
        </Tooltip>
        <Styled.BookIcon />
      </>
    ),
  });

  const authCmps: Record<string, ReactNode> = {
    paths: <FilePaths credentials={credentials} />,
    hex: <EncodedStrings credentials={credentials} encoding="hex" />,
    base64: <EncodedStrings credentials={credentials} encoding="base64" />,
  };

  return (
    <>
      <DetailsList details={hosts} />
      <Styled.RadioGroup
        name="authType"
        value={authType}
        size="small"
        onChange={e => setAuthType(e.target.value)}
      >
        {credentials.admin && [
          <Radio.Button key="paths" value="paths">
            {l('filePaths')}
          </Radio.Button>,
          <Radio.Button key="hex" value="hex">
            {l('hexStrings')}
          </Radio.Button>,
          <Radio.Button key="base64" value="base64">
            {l('base64Strings')}
          </Radio.Button>,
        ]}
      </Styled.RadioGroup>
      {authCmps[authType]}
    </>
  );
};

export default ConnectTab;
