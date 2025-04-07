import React, { ReactNode, useMemo } from 'react';
import styled from '@emotion/styled';
import { Drawer, Tooltip } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { LitdNode } from 'shared/types';
import * as PLIT from 'lib/litd/types';
import { useStoreActions, useStoreState } from 'store';
import { ellipseInner } from 'utils/strings';
import { CopyIcon } from 'components/common';
import DetailsList, { DetailValues } from 'components/common/DetailsList';
import LncRevokeButton from './LncRevokeButton';

const Styled = {
  DetailsList: styled(DetailsList)`
    margin: 0 0 10px 0;
  `,
};

/** A helper hook to query the info of a specific LNC session from the store */
const useLncSession = (nodeName?: string, sessionId?: string) => {
  const { nodes } = useStoreState(s => s.lit);
  return useMemo(() => {
    const result: { session?: PLIT.Session } = {};
    if (!nodeName) return result;
    const nodeState = nodes[nodeName];
    if (nodeState?.sessions?.length) {
      result.session = nodeState.sessions.find(a => a.id === sessionId);
    }
    return result;
  }, [nodes, sessionId, nodeName]);
};

const createCopyItem = (label: string, value: string) => ({
  label,
  value: (
    <CopyIcon
      value={value}
      label={label}
      text={
        <Tooltip overlay={value} placement="topLeft">
          {ellipseInner(value)}
        </Tooltip>
      }
    />
  ),
});

interface Props {
  node: LitdNode;
}

const LncSessionDrawer: React.FC<Props> = ({ node }) => {
  const { l } = usePrefixedTranslation(
    'cmps.designer.lightning.connect.LncSessionDrawer',
  );

  const { visible, sessionId, nodeName } = useStoreState(s => s.modals.lncSessionInfo);
  const { hideLncSessionInfo } = useStoreActions(s => s.modals);
  const { session } = useLncSession(nodeName, sessionId);

  let cmp: ReactNode = undefined;
  if (session) {
    const sessionDetails: DetailValues = [
      createCopyItem('ID', session.id),
      createCopyItem(l('pairingPhrase'), session.pairingPhrase),
      createCopyItem(l('mailboxServerAddr'), session.mailboxServerAddr),
      { label: l('state'), value: session.state },
      { label: l('type'), value: session.type },
      createCopyItem(l('accountId'), session.accountId || 'N/A'),
      createCopyItem(l('localPublicKey'), session.localPublicKey),
      createCopyItem(l('remotePublicKey'), session.remotePublicKey || 'N/A'),
      { label: l('createdAt'), value: new Date(session.createdAt).toLocaleString() },
      { label: l('expiresAt'), value: new Date(session.expiresAt).toLocaleString() },
    ];

    cmp = (
      <>
        <h2>{session.label}</h2>
        <Styled.DetailsList details={sessionDetails} />
        {session.state !== 'Revoked' && (
          <LncRevokeButton node={node} localPublicKey={session.localPublicKey} />
        )}
      </>
    );
  } else {
    cmp = <p>{l('notFound', { sessionId })}</p>;
  }

  return (
    <Drawer
      title={l('title')}
      open={visible}
      onClose={() => hideLncSessionInfo()}
      destroyOnClose
    >
      {cmp}
    </Drawer>
  );
};

export default LncSessionDrawer;
