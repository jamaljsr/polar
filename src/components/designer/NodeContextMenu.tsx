import React, { ReactElement } from 'react';
import styled from '@emotion/styled';
import { INode } from '@mrblenny/react-flow-chart';
import { Dropdown, Menu } from 'antd';
import { LightningNode, Status } from 'shared/types';
import { useStoreState } from 'store';
import { AdvancedOptionsButton, RemoveNode, RestartNode } from 'components/common';
import { OpenTerminalButton } from 'components/terminal';
import { OpenChannelButtons, PaymentButtons } from './lightning/actions';

const Styled = {
  MenuItem: styled(Menu.Item)`
    & > span {
      display: inline-block;
      width: 100%;
    }
  `,
};

const createItem = (key: string, cmp: ReactElement, condition?: boolean) => {
  if (condition === false) return null;
  return <Styled.MenuItem key={key}>{cmp}</Styled.MenuItem>;
};

interface Props {
  node: INode;
}

const NodeContextMenu: React.FC<Props> = ({ node: { id }, children }) => {
  const { activeId } = useStoreState(s => s.designer);
  const network = useStoreState(s => s.network.networkById(activeId));

  // find the network node by name
  const node = [...network.nodes.bitcoin, ...network.nodes.lightning].find(
    n => n.name === id,
  );
  // don't add a context menu if the node is not valid
  if (!node) return <>{children}</>;

  const isLN = node.type === 'lightning';
  const isStarted = node.status === Status.Started;

  const menu = (
    <Menu style={{ width: 200 }}>
      {isStarted && [
        createItem(
          'inv',
          <PaymentButtons menuType="create" node={node as LightningNode} />,
          isLN,
        ),
        createItem(
          'pay',
          <PaymentButtons menuType="pay" node={node as LightningNode} />,
          isLN,
        ),
        createItem(
          'outgoing',
          <OpenChannelButtons menuType="outgoing" node={node as LightningNode} />,
          isLN,
        ),
        createItem(
          'incoming',
          <OpenChannelButtons menuType="incoming" node={node as LightningNode} />,
          isLN,
        ),
        createItem('terminal', <OpenTerminalButton type="menu" node={node} />),
        <Menu.Divider key="divider" />,
      ]}
      {createItem(
        'start',
        <RestartNode menuType="start" node={node} />,
        [Status.Stopped, Status.Error].includes(node.status),
      )}
      {createItem(
        'stop',
        <RestartNode menuType="stop" node={node} />,
        [Status.Started].includes(node.status),
      )}
      {createItem('options', <AdvancedOptionsButton type="menu" node={node} />)}
      {createItem('remove', <RemoveNode type="menu" node={node} />)}
    </Menu>
  );

  return (
    <Dropdown overlay={menu} trigger={['contextMenu']}>
      {children}
    </Dropdown>
  );
};

export default NodeContextMenu;
