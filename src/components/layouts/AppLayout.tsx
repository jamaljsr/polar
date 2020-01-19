import React from 'react';
import { Link } from 'react-router-dom';
import styled from '@emotion/styled';
import { Layout } from 'antd';
import { useTheme } from 'hooks/useTheme';
import { useStoreState } from 'store';
import { ThemeColors } from 'theme/colors';
import { NavMenu } from 'components/common';
import { HOME } from 'components/routing';
import logo from 'resources/logo.png';
import { DockerStatus, LocaleSwitch, ThemeSwitch } from './';

const { Header, Content, Footer } = Layout;

const Styled = {
  Layout: styled(Layout)<{ colors: ThemeColors }>`
    min-height: 100vh;
    overflow: hidden;

    //--- antd overrides ---
    .ant-form-item-label {
      margin-bottom: 5px;
    }
    .ant-form-item-with-help {
      margin-bottom: 12px;
    }
    .ant-alert-info {
      background-color: ${props => props.colors.alert.background};
      border: 1px solid ${props => props.colors.alert.border};
    }
    .ant-badge-status-default {
      background-color: ${props => props.colors.statusBadge.default};
    }
  `,
  Header: styled(Header)`
    padding: 0 16px;
  `,
  Logo: styled.div`
    height: 64px;
    width: 120px;
    float: left;
  `,
  Image: styled.img`
    height: 16px;
    display: inline-block;
    vertical-align: middle;
    margin-right: 10px;
  `,
  Brand: styled.span`
    display: inline-block;
    color: #fff;
    font-weight: 300;
    font-size: 18px;
    vertical-align: middle;
  `,
  Content: styled(Content)`
    display: flex;
  `,
  Footer: styled(Footer)<{ colors: ThemeColors['footer'] }>`
    display: flex;
    justify-content: space-between;
    padding: 0 5px;
    background: ${props => props.colors.background};
  `,
  FooterToggles: styled.span`
    display: inline-block;
  `,
};

interface Props {
  children: React.ReactNode;
}

const AppLayout: React.FC<Props> = (props: Props) => {
  const { initialized } = useStoreState(s => s.app);
  const theme = useTheme();
  return (
    <Styled.Layout colors={theme}>
      {/* hide the header until the theme has been loaded */}
      {initialized && (
        <Styled.Header>
          <Styled.Logo>
            <Link to={HOME}>
              <Styled.Image src={logo} alt="logo" />
              <Styled.Brand>Polar</Styled.Brand>
            </Link>
          </Styled.Logo>
          <NavMenu />
        </Styled.Header>
      )}
      <Styled.Content>{props.children}</Styled.Content>
      <Styled.Footer colors={theme.footer}>
        <DockerStatus />
        <Styled.FooterToggles>
          <LocaleSwitch />
          <ThemeSwitch />
        </Styled.FooterToggles>
      </Styled.Footer>
    </Styled.Layout>
  );
};

export default AppLayout;
