import React, { ReactNode, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { Icon, Radio, Tooltip } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { CLightningNode, LightningNode, LndNode, Status } from 'shared/types';
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

export interface ConnectionInfo {
  restUrl: string;
  restDocsUrl: string;
  grpcUrl?: string;
  grpcDocsUrl?: string;
  credentials: {
    admin: string;
    readOnly?: string;
    cert?: string;
  };
}

interface Props {
  node: LightningNode;
}

const ConnectTab: React.FC<Props> = ({ node }) => {
  const { l } = usePrefixedTranslation('cmps.designer.lnd.ConnectTab');
  const [authType, setAuthType] = useState<string>('paths');
  const { openInBrowser } = useStoreActions(s => s.app);
  const nodeState = useStoreState(s => s.lightning.nodes[node.name]);

  const lnUrl = nodeState && nodeState.info ? nodeState.info.rpcUrl : '';
  const info = useMemo((): ConnectionInfo | undefined => {
    if (node.status !== Status.Started) return;
    if (node.implementation === 'LND') {
      const lnd = node as LndNode;
      return {
        restUrl: `https://127.0.0.1:${lnd.ports.rest}`,
        restDocsUrl: 'https://api.lightning.community/rest/',
        grpcUrl: `127.0.0.1:${lnd.ports.grpc}`,
        grpcDocsUrl: 'https://api.lightning.community/',
        credentials: {
          admin: lnd.paths.adminMacaroon,
          readOnly: lnd.paths.readonlyMacaroon,
          cert: lnd.paths.tlsCert,
        },
      };
    } else if (node.implementation === 'c-lightning') {
      const cln = node as CLightningNode;
      return {
        restUrl: `https://127.0.0.1:${cln.ports.rest}`,
        restDocsUrl: 'https://github.com/Ride-The-Lightning/c-lightning-REST',
        credentials: {
          admin: cln.paths.macaroon,
        },
      };
    }
  }, [node]);

  if (node.status !== Status.Started) {
    return <>{l('notStarted')}</>;
  }

  if (!info) {
    return <>{l('unsupported', { implementation: node.implementation })}</>;
  }

  const { restUrl, grpcUrl, credentials } = info;
  const hosts: DetailValues = [
    [l('grpcHost'), grpcUrl, grpcUrl],
    [l('restHost'), restUrl, restUrl],
    [l('p2pLnUrl'), lnUrl, ellipseInner(lnUrl, 3, 19)],
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
        <Styled.Icon type="book" />
      </>
    ),
  });

  const authCmps: Record<string, ReactNode> = {
    paths: <FilePaths credentials={credentials} />,
    hex: <EncodedStrings credentials={credentials} encoding="hex" />,
    base64: <EncodedStrings credentials={credentials} encoding="base64" />,
    lndc: node.implementation === 'LND' && <LndConnect node={node as LndNode} />,
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
        {node.implementation === 'LND' && (
          <Radio.Button value="lndc">{l('lndConnect')}</Radio.Button>
        )}
      </Styled.RadioGroup>
      {authCmps[authType]}
    </>
  );
};

export default ConnectTab;
