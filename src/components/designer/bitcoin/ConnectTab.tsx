import React from 'react';
import { BookOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Tooltip } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { BitcoinNode, Status } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { bitcoinCredentials } from 'utils/constants';
import { getNetworkBackendId } from 'utils/network';
import { formatP2PHost } from 'utils/strings';
import { CopyIcon, DetailsList } from 'components/common';
import { DetailValues } from 'components/common/DetailsList';

const Styled = {
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

interface Props {
  node: BitcoinNode;
}

const ConnectTab: React.FC<Props> = ({ node }) => {
  const { l } = usePrefixedTranslation('cmps.designer.bitcoind.ConnectTab');
  const { openInBrowser } = useStoreActions(s => s.app);
  const nodeState = useStoreState(s => s.bitcoin.nodes[getNetworkBackendId(node)]);

  if (node.status !== Status.Started) {
    return <>{l('notStarted')}</>;
  }

  const p2pHost = nodeState?.info?.p2pHost;
  const details: DetailValues = [
    { label: l('rpcHost'), value: `http://127.0.0.1:${node.ports.rpc}` },
    { label: l('p2pHost'), value: p2pHost },
    { label: l('zmqBlockHost'), value: `tcp://127.0.0.1:${node.ports.zmqBlock}` },
    { label: l('zmqTxHost'), value: `tcp://127.0.0.1:${node.ports.zmqTx}` },
    { label: l('rpcUser'), value: bitcoinCredentials.user },
    { label: l('rpcPass'), value: bitcoinCredentials.pass },
  ].map(({ label, value }) => ({
    label,
    value: <CopyIcon label={label} value={value as string} text={formatP2PHost(value)} />,
  }));

  const restDocsUrl =
    'https://bitcoin.org/en/developer-reference#remote-procedure-calls-rpcs';
  details.push({
    label: l('apiDocs'),
    value: (
      <>
        <Tooltip title={restDocsUrl}>
          <Styled.Link onClick={() => openInBrowser(restDocsUrl)}>REST</Styled.Link>
        </Tooltip>
        <Styled.BookIcon />
      </>
    ),
  });

  return (
    <>
      <DetailsList details={details} />
    </>
  );
};

export default ConnectTab;
