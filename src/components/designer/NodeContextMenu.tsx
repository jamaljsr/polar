import React, { ReactElement } from 'react';
import styled from '@emotion/styled';
import { INode } from '@mrblenny/react-flow-chart';
import { Dropdown, Menu, MenuProps } from 'antd';
import { BitcoinNode, LightningNode, Status } from 'shared/types';
import { useStoreState } from 'store';
import { AdvancedOptionsButton, RemoveNode, RestartNode } from 'components/common';
import { ViewLogsButton } from 'components/dockerLogs';
import { OpenTerminalButton } from 'components/terminal';
import SendOnChainButton from './bitcoind/actions/SendOnChainButton';
import { OpenChannelButtons, PaymentButtons } from './lightning/actions';

const Styled = {
  Menu: styled(Menu)`
    .ant-dropdown-menu-title-content {
      margin: -5px -12px;
      padding: 5px 12px;
      display: block;

      svg {
        margin-right: 5px;
      }
    }
  `,
};

const addItemIf = (
  key: string,
  cmp: ReactElement,
  condition?: boolean,
): { key: string; label: ReactElement }[] => {
  if (condition === false) return [];
  return [{ key, label: cmp }];
};

interface Props {
  node: INode;
}

const NodeContextMenu: React.FC<Props> = ({ node: { id }, children }) => {
  const { activeId } = useStoreState(s => s.designer);
  const networks = useStoreState(s => s.network.networks);
  const network = networks.find(n => n.id === activeId);

  // don't add a context menu if there is no network found
  if (!network) return <>{children}</>;

  // find the network node by name
  const node = [...network.nodes.bitcoin, ...network.nodes.lightning].find(
    n => n.name === id,
  );
  // don't add a context menu if the node is not valid
  if (!node) return <>{children}</>;

  const isLN = node.type === 'lightning';
  const isBackend = node.type === 'bitcoin';
  const isStarted = node.status === Status.Started;

  let items: MenuProps['items'] = [];
  items = items.concat(
    addItemIf(
      'inv',
      <PaymentButtons menuType="create" node={node as LightningNode} />,
      isStarted && isLN,
    ),
    addItemIf(
      'pay',
      <PaymentButtons menuType="pay" node={node as LightningNode} />,
      isStarted && isLN,
    ),
    addItemIf(
      'outgoing',
      <OpenChannelButtons menuType="outgoing" node={node as LightningNode} />,
      isStarted && isLN,
    ),
    addItemIf(
      'incoming',
      <OpenChannelButtons menuType="incoming" node={node as LightningNode} />,
      isStarted && isLN,
    ),
    addItemIf(
      'sendonchain',
      <SendOnChainButton type="menu" node={node as BitcoinNode} />,
      isStarted && isBackend,
    ),
    addItemIf('terminal', <OpenTerminalButton type="menu" node={node} />, isStarted),
    isStarted ? [{ type: 'divider' }] : [],
    addItemIf(
      'start',
      <RestartNode menuType="start" node={node} />,
      [Status.Stopped, Status.Error].includes(node.status),
    ),
    addItemIf(
      'stop',
      <RestartNode menuType="stop" node={node} />,
      [Status.Started].includes(node.status),
    ),
    addItemIf(
      'logs',
      <ViewLogsButton type="menu" node={node} />,
      [Status.Starting, Status.Started, Status.Error].includes(node.status),
    ),
    addItemIf('options', <AdvancedOptionsButton type="menu" node={node} />),
    addItemIf('remove', <RemoveNode type="menu" node={node} />),
  );

  return (
    <Dropdown
      overlay={<Styled.Menu style={{ width: 200 }} items={items} />}
      trigger={['contextMenu']}
    >
      {children}
    </Dropdown>
  );
};

export default NodeContextMenu;
