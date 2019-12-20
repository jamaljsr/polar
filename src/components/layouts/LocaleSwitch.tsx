import React from 'react';
import styled from '@emotion/styled';
import { Button, Dropdown, Icon, Menu } from 'antd';
import { ClickParam } from 'antd/lib/menu';
import { useStoreState } from 'easy-peasy';
import { languages } from 'i18n';
import { useStoreActions } from 'store';

const Styled = {
  Button: styled(Button)`
    color: inherit;
  `,
};

const LocaleSwitch: React.FC = () => {
  const { settings } = useStoreState(s => s.app);
  const { updateSettings } = useStoreActions(s => s.app);
  const changeLanguage = (e: ClickParam) => {
    updateSettings({ lang: e.key });
  };

  const menu = (
    <Menu onClick={changeLanguage} selectedKeys={[settings.lang]}>
      {Object.entries(languages).map(([key, lang]) => (
        <Menu.Item key={key}>
          {lang} ({key})
        </Menu.Item>
      ))}
    </Menu>
  );

  return (
    <>
      <Dropdown overlay={menu} placement="topRight">
        <Styled.Button type="link">
          <Icon type="global" />
          {languages[settings.lang]}
        </Styled.Button>
      </Dropdown>
    </>
  );
};

export default LocaleSwitch;
