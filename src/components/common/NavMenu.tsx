import React from 'react';
import { PlusOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Menu } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useStoreActions } from 'store';
import { NETWORK_NEW } from 'components/routing';

const Styled = {
  Menu: styled.div`
    float: right;
    margin-top: 9px;
  `,
  PlusIcon: styled(PlusOutlined)`
    font-size: 1.2rem;
    color: #fff;
  `,
};

const NavMenu: React.FC = () => {
  const { l } = usePrefixedTranslation('cmps.common.NavMenu');
  const { navigateTo } = useStoreActions(s => s.app);

  return (
    <Styled.Menu>
      <Menu theme="dark" mode="horizontal" selectable={false}>
        <Menu.Item onClick={() => navigateTo(NETWORK_NEW)}>
          <Styled.PlusIcon />
          {l('createNetwork')}
        </Menu.Item>
      </Menu>
    </Styled.Menu>
  );
};

export default NavMenu;
