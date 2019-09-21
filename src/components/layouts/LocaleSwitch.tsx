import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';
import { Button } from 'antd';

const StyledButton = styled(Button)`
  padding: 0 5px;
`;

const LocaleSwitch: React.FC = () => {
  const { i18n } = useTranslation();
  const setEnglish = () => i18n.changeLanguage('en-US');
  const setSpanish = () => i18n.changeLanguage('es');

  return (
    <>
      <StyledButton type="link" onClick={setEnglish}>
        EN
      </StyledButton>
      |
      <StyledButton type="link" onClick={setSpanish}>
        ES
      </StyledButton>
    </>
  );
};

export default LocaleSwitch;
