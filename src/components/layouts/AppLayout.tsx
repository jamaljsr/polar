import React, { useState } from 'react';
import { Layout, Menu, Icon, Button } from 'antd';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HOME, COUNTER, NETWORK } from 'components/Routes';
import logo from 'resources/logo.png';
import styles from './AppLayout.module.less';

const { Header, Content, Footer, Sider } = Layout;
const { SubMenu } = Menu;

interface Props {
  children: React.ReactNode;
}

const AppLayout: React.FC<Props> = (props: Props) => {
  const { t, i18n } = useTranslation();
  const [collapsed, setCollapsed] = useState(true);
  const toggle = () => setCollapsed(!collapsed);
  const setEnglish = () => i18n.changeLanguage('en-US');
  const setSpanish = () => i18n.changeLanguage('es');

  return (
    <Layout className={styles.layout}>
      <Sider collapsible collapsed={collapsed} trigger={null} data-tid="sider">
        <div className={styles.logo}>
          <Link to={HOME} data-tid="logo">
            <img src={logo} alt="logo" />
            {!collapsed && <span>Polar</span>}
          </Link>
        </div>
        <Menu theme="dark" mode="inline" selectable={false}>
          <Menu.Item key="1">
            <Link to={HOME} data-tid="nav-home">
              <Icon type="pie-chart" />
              <span>{t('cmps.app-layout.home', 'Home')}</span>
            </Link>
          </Menu.Item>
          <Menu.Item key="2">
            <Link to={COUNTER} data-tid="nav-counter">
              <Icon type="desktop" />
              <span>{t('cmps.app-layout.counter', 'Counter')}</span>
            </Link>
          </Menu.Item>
          <SubMenu
            key="sub1"
            title={
              <span>
                <Icon type="user" />
                <span>{t('cmps.app-layout.menu', 'Menu')}</span>
              </span>
            }
          >
            <Menu.Item key="3">{t('cmps.app-layout.item1', 'Item 1')}</Menu.Item>
            <Menu.Item key="4">{t('cmps.app-layout.item2', 'Item 2')}</Menu.Item>
            <Menu.Item key="5">{t('cmps.app-layout.item3', 'Item 3')}</Menu.Item>
          </SubMenu>
        </Menu>
      </Sider>
      <Layout>
        <Header className={styles.header}>
          <Icon
            className={styles.trigger}
            type={collapsed ? 'menu-unfold' : 'menu-fold'}
            onClick={toggle}
            data-tid="trigger"
          />
          <Link to={NETWORK}>
            <Button type="primary" icon="plus">
              {t('cmps.app-layout.new-network', 'Network')}
            </Button>
          </Link>
        </Header>
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
