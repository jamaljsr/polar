import React from 'react';
import { Link } from 'react-router-dom';
import { Layout } from 'antd';
import { NavMenu } from 'components/common';
import { HOME } from 'components/routing';
import logo from 'resources/logo.png';
import LocaleSwitch from './LocaleSwitch';
import styles from './AppLayout.module.less';

const { Header, Content, Footer } = Layout;

interface Props {
  children: React.ReactNode;
}

const AppLayout: React.FC<Props> = (props: Props) => {
  return (
    <Layout className={styles.layout}>
      <Header>
        <div className={styles.logo}>
          <Link to={HOME} data-tid="logo">
            <img src={logo} alt="logo" />
            <span>Polar</span>
          </Link>
        </div>
        <NavMenu />
      </Header>
      <Content className={styles.content}>{props.children}</Content>
      <Footer className={styles.footer}>
        Polar &copy; 2019 Fomo Bros <LocaleSwitch />
      </Footer>
    </Layout>
  );
};

export default AppLayout;
