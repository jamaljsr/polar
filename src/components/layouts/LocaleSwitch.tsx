import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';
import { Button } from 'antd';

const Styled = {
  Button: styled(Button)`
    padding: 0 5px;
  `,
};

const LocaleSwitch: React.FC = () => {
  const { i18n } = useTranslation();
  const setEnglish = () => i18n.changeLanguage('en-US');
  const setSpanish = () => i18n.changeLanguage('es');

  return (
    <>
      <Styled.Button type="link" onClick={setEnglish}>
        EN
      </Styled.Button>
      |
      <Styled.Button type="link" onClick={setSpanish}>
        ES
      </Styled.Button>
    </>
  );
};

export default LocaleSwitch;
