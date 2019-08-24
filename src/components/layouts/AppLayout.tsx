import React from 'react';
import { Layout, Button } from 'antd';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HOME } from 'components/Routes';
import { NetworkList } from 'components/network';
import logo from 'resources/logo.png';
import styles from './AppLayout.module.less';

const { Header, Content, Footer, Sider } = Layout;

interface Props {
  children: React.ReactNode;
}

const AppLayout: React.FC<Props> = (props: Props) => {
  const { i18n } = useTranslation();
  const setEnglish = () => i18n.changeLanguage('en-US');
  const setSpanish = () => i18n.changeLanguage('es');

  return (
    <Layout className={styles.layout}>
      <Sider data-tid="sider">
        <div className={styles.logo}>
          <Link to={HOME} data-tid="logo">
            <img src={logo} alt="logo" />
            <span>Polar</span>
          </Link>
        </div>
        <NetworkList />
      </Sider>
      <Layout>
        <Header className={styles.header}></Header>
        <Content className={styles.content}>
          <div className={styles.container}>{props.children}</div>
        </Content>
        <Footer className={styles.footer}>
          Polar &copy; 2019 Fomo Bros{' '}
          <Button
            type="link"
            className={styles.btn}
            onClick={setEnglish}
            data-tid="english"
          >
            EN
          </Button>
          |
          <Button
            type="link"
            className={styles.btn}
            onClick={setSpanish}
            data-tid="spanish"
          >
            ES
          </Button>
        </Footer>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
