import React from 'react';
import { BookOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Tooltip } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { BitcoinNode, Status } from 'shared/types';
import { useStoreActions } from 'store';
import { bitcoinCredentials, btcdCredentials } from 'utils/constants';
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

  if (node.status !== Status.Started) {
    return <>{l('notStarted')}</>;
  }

  const isBtcd = node.implementation === 'btcd';

  let details: DetailValues;
  let docsUrl: string;
  let docsLabel: string;

  if (isBtcd) {
    // btcd-specific connection info
    details = [
      { label: l('grpcHost'), value: `127.0.0.1:${node.ports.grpc}` },
      { label: l('walletRpcHost'), value: `127.0.0.1:${node.ports.btcdWallet}` },
      { label: l('p2pHost'), value: `tcp://127.0.0.1:${node.ports.p2p}` },
      { label: l('rpcUser'), value: btcdCredentials.user },
      { label: l('rpcPass'), value: btcdCredentials.pass },
    ].map(({ label, value }) => ({
      label,
      value: <CopyIcon label={label} value={value} text={value} />,
    }));
    docsUrl = 'https://github.com/btcsuite/btcd/blob/master/docs/json_rpc_api.md';
    docsLabel = 'JSON-RPC';
  } else {
    // bitcoind connection info
    details = [
      { label: l('rpcHost'), value: `http://127.0.0.1:${node.ports.rpc}` },
      { label: l('p2pHost'), value: `tcp://127.0.0.1:${node.ports.p2p}` },
      { label: l('zmqBlockHost'), value: `tcp://127.0.0.1:${node.ports.zmqBlock}` },
      { label: l('zmqTxHost'), value: `tcp://127.0.0.1:${node.ports.zmqTx}` },
      { label: l('rpcUser'), value: bitcoinCredentials.user },
      { label: l('rpcPass'), value: bitcoinCredentials.pass },
    ].map(({ label, value }) => ({
      label,
      value: <CopyIcon label={label} value={value} text={value} />,
    }));
    docsUrl = 'https://bitcoin.org/en/developer-reference#remote-procedure-calls-rpcs';
    docsLabel = 'REST';
  }

  details.push({
    label: l('apiDocs'),
    value: (
      <>
        <Tooltip title={docsUrl}>
          <Styled.Link onClick={() => openInBrowser(docsUrl)}>{docsLabel}</Styled.Link>
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
