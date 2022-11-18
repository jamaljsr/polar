import React from 'react';
import { GlobalOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Button, Dropdown } from 'antd';
import { MenuProps } from 'antd/lib/menu';
import { languages } from 'i18n';
import { useStoreActions, useStoreState } from 'store';

const Styled = {
  Button: styled(Button)`
    color: inherit;
  `,
};

const LocaleSwitch: React.FC = () => {
  const { settings } = useStoreState(s => s.app);
  const { updateSettings } = useStoreActions(s => s.app);
  const changeLanguage: MenuProps['onClick'] = e => {
    updateSettings({ lang: e.key.toString() });
  };

  const items: MenuProps['items'] = Object.entries(languages).map(([key, lang]) => ({
    key,
    label: `${lang} (${key})`,
  }));

  return (
    <>
      <Dropdown
        menu={{ onClick: changeLanguage, selectedKeys: [settings.lang], items }}
        placement="topRight"
      >
        <Styled.Button type="link">
          <GlobalOutlined />
          {languages[settings.lang]}
        </Styled.Button>
      </Dropdown>
    </>
  );
};

export default LocaleSwitch;
