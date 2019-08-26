import React from 'react';
import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import styles from './LocaleSwitch.module.less';

const LocaleSwitch: React.FC = () => {
  const { i18n } = useTranslation();
  const setEnglish = () => i18n.changeLanguage('en-US');
  const setSpanish = () => i18n.changeLanguage('es');

  return (
    <>
      <Button type="link" className={styles.btn} onClick={setEnglish} data-tid="english">
        EN
      </Button>
      |
      <Button type="link" className={styles.btn} onClick={setSpanish} data-tid="spanish">
        ES
      </Button>
    </>
  );
};

export default LocaleSwitch;
