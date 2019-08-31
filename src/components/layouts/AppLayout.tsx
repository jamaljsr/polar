import React from 'react';
import { Link } from 'react-router-dom';
import { Layout } from 'antd';
import { NetworkList } from 'components/network';
import { HOME } from 'components/routing';
import logo from 'resources/logo.png';
import LocaleSwitch from './LocaleSwitch';
import styles from './AppLayout.module.less';

const { Content, Footer, Sider } = Layout;

interface Props {
  children: React.ReactNode;
}

const AppLayout: React.FC<Props> = (props: Props) => {
  return (
    <Layout className={styles.layout}>
      <Sider data-tid="sider" collapsible>
        <div className={styles.logo}>
          <Link to={HOME} data-tid="logo">
            <img src={logo} alt="logo" />
            <span>Polar</span>
          </Link>
        </div>
        <NetworkList />
      </Sider>
      <Layout>
        <Content className={styles.content}>
          <div className={styles.container}>{props.children}</div>
        </Content>
        <Footer className={styles.footer}>
          Polar &copy; 2019 Fomo Bros <LocaleSwitch />
        </Footer>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
