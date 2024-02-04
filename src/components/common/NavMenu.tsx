import React, { useCallback } from 'react';
import { DatabaseOutlined, ImportOutlined, PlusOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Menu, MenuProps } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useStoreActions } from 'store';
import { NETWORK_IMPORT, NETWORK_NEW, NODE_IMAGES } from 'components/routing';

const Styled = {
  Menu: styled.div`
    width: 496px;
  `,
};

const NavMenu: React.FC = () => {
  const { l } = usePrefixedTranslation('cmps.common.NavMenu');
  const { navigateTo } = useStoreActions(s => s.app);
  const handleClick: MenuProps['onClick'] = useCallback(
    (info: { key: string }) => navigateTo(info.key),
    [],
  );

  const items: MenuProps['items'] = [
    { label: l('createNetwork'), key: NETWORK_NEW, icon: <PlusOutlined /> },
    { label: l('importNetwork'), key: NETWORK_IMPORT, icon: <ImportOutlined /> },
    { label: l('manageNodes'), key: NODE_IMAGES, icon: <DatabaseOutlined /> },
  ];

  return (
    <Styled.Menu>
      <Menu
        theme="dark"
        mode="horizontal"
        selectable={false}
        items={items}
        onClick={handleClick}
      />
    </Styled.Menu>
  );
};

export default NavMenu;
