import React, { ReactNode, useMemo, useState } from 'react';
import { BookOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Radio, Tooltip } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { CLightningNode, EclairNode, LightningNode, LndNode, Status } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { eclairCredentials } from 'utils/constants';
import { ellipseInner } from 'utils/strings';
import CopyIcon from 'components/common/CopyIcon';
import DetailsList, { DetailValues } from 'components/common/DetailsList';
import { BasicAuth, EncodedStrings, FilePaths, LndConnect } from './connect';

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
  restDocsUrl: string;
  grpcUrl?: string;
  grpcDocsUrl?: string;
  credentials: {
    admin?: string;
    readOnly?: string;
    invoice?: string;
    cert?: string;
    certKey?: string;
    basicAuth?: string;
  };
  p2pUriExternal: string;
  authTypes: string[];
}

interface Props {
  node: LightningNode;
}

const ConnectTab: React.FC<Props> = ({ node }) => {
  const { l } = usePrefixedTranslation('cmps.designer.lightning.ConnectTab');
  const [authType, setAuthType] = useState<string>(
    node.implementation === 'eclair' ? 'basic' : 'paths',
  );
  const { openInBrowser } = useStoreActions(s => s.app);
  const nodeState = useStoreState(s => s.lightning.nodes[node.name]);
  const pubkey = nodeState && nodeState.info ? nodeState.info.pubkey : '';
  const p2pLnUrlInternal = nodeState && nodeState.info ? nodeState.info.rpcUrl : '';

  const info = useMemo((): ConnectionInfo => {
    if (node.status === Status.Started) {
      if (node.implementation === 'LND') {
        const lnd = node as LndNode;
        return {
          restUrl: `https://127.0.0.1:${lnd.ports.rest}`,
          restDocsUrl: 'https://api.lightning.community/#lnd-rest-api-reference',
          grpcUrl: `127.0.0.1:${lnd.ports.grpc}`,
          grpcDocsUrl: 'https://api.lightning.community/',
          credentials: {
            admin: lnd.paths.adminMacaroon,
            readOnly: lnd.paths.readonlyMacaroon,
            invoice: lnd.paths.invoiceMacaroon,
            cert: lnd.paths.tlsCert,
          },
          p2pUriExternal: `${pubkey}@127.0.0.1:${lnd.ports.p2p}`,
          authTypes: ['paths', 'hex', 'base64', 'lndc'],
        };
      } else if (node.implementation === 'c-lightning') {
        const cln = node as CLightningNode;
        return {
          restUrl: `http://127.0.0.1:${cln.ports.rest}`,
          restDocsUrl: 'https://github.com/Ride-The-Lightning/c-lightning-REST',
          grpcUrl: cln.ports.grpc ? `127.0.0.1:${cln.ports.grpc}` : undefined,
          credentials: {
            admin: cln.paths.macaroon,
            cert: cln.paths.tlsCert,
            certKey: cln.paths.tlsKey,
          },
          p2pUriExternal: `${pubkey}@127.0.0.1:${cln.ports.p2p}`,
          authTypes: ['paths', 'hex', 'base64'],
        };
      } else if (node.implementation === 'eclair') {
        const eln = node as EclairNode;
        return {
          restUrl: `http://127.0.0.1:${eln.ports.rest}`,
          restDocsUrl: 'https://acinq.github.io/eclair',
          credentials: {
            basicAuth: eclairCredentials.pass,
          },
          p2pUriExternal: `${pubkey}@127.0.0.1:${eln.ports.p2p}`,
          authTypes: ['basic'],
        };
      }
    }

    return {
      restUrl: '',
      restDocsUrl: '',
      credentials: {},
      p2pUriExternal: '',
      authTypes: [],
    } as ConnectionInfo;
  }, [node, pubkey]);

  // ensure an appropriate auth type is used when switching nodes
  const nodeAuthType = useMemo(() => {
    if (!info.authTypes.includes(authType)) {
      return info.authTypes[0];
    }
    return authType;
  }, [authType, info.authTypes]);

  if (node.status !== Status.Started) {
    return <>{l('notStarted')}</>;
  }

  const { restUrl, grpcUrl, credentials } = info;
  const hosts: DetailValues = [
    [l('grpcHost'), grpcUrl, grpcUrl],
    [l('restHost'), restUrl, restUrl],
    [l('p2pLnUrlInternal'), p2pLnUrlInternal, ellipseInner(p2pLnUrlInternal, 3, 17)],
    [
      l('p2pLnUrlExternal'),
      info.p2pUriExternal,
      ellipseInner(info.p2pUriExternal, 3, 17),
    ],
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
        {info.grpcDocsUrl && (
          <Tooltip title={info.grpcDocsUrl}>
            <Styled.Link onClick={() => openInBrowser(info.grpcDocsUrl as string)}>
              GRPC
            </Styled.Link>
          </Tooltip>
        )}
        <Tooltip title={info.restDocsUrl}>
          <Styled.Link onClick={() => openInBrowser(info.restDocsUrl)}>REST</Styled.Link>
        </Tooltip>
        <Styled.BookIcon />
      </>
    ),
  });

  const authCmps: Record<string, ReactNode> = {
    paths: <FilePaths credentials={credentials} />,
    hex: <EncodedStrings credentials={credentials} encoding="hex" />,
    base64: <EncodedStrings credentials={credentials} encoding="base64" />,
    lndc: node.implementation === 'LND' && <LndConnect node={node as LndNode} />,
    basic: credentials.basicAuth && <BasicAuth password={credentials.basicAuth} />,
  };

  return (
    <>
      <DetailsList details={hosts} />
      <Styled.RadioGroup
        name="authType"
        value={nodeAuthType}
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
        {node.implementation === 'LND' && (
          <Radio.Button value="lndc">{l('lndConnect')}</Radio.Button>
        )}
        {credentials.basicAuth && (
          <Radio.Button value="basic">{l('basicAuth')}</Radio.Button>
        )}
      </Styled.RadioGroup>
      {authCmps[nodeAuthType]}
    </>
  );
};

export default ConnectTab;
