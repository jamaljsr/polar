import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';
import { Button, Dropdown, Icon, Menu } from 'antd';
import { ClickParam } from 'antd/lib/menu';
import { localeConfig } from 'i18n';

const Styled = {
  Button: styled(Button)`
    color: inherit;
  `,
};

const LocaleSwitch: React.FC = () => {
  const { i18n } = useTranslation();
  const changeLanguage = (e: ClickParam) => {
    i18n.changeLanguage(e.key);
  };

  const menu = (
    <Menu onClick={changeLanguage} selectedKeys={[i18n.language]}>
      {Object.entries(localeConfig.languages).map(([key, lang]) => (
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
          {localeConfig.languages[i18n.language]}
        </Styled.Button>
      </Dropdown>
    </>
  );
};

export default LocaleSwitch;
