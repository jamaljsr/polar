import React from 'react';
import { Link } from 'react-router-dom';
import { css, Global } from '@emotion/react';
import styled from '@emotion/styled';
import { Layout } from 'antd';
import { useTheme } from 'hooks/useTheme';
import { useStoreActions, useStoreState } from 'store';
import { ThemeColors } from 'theme/colors';
import { NavMenu } from 'components/common';
import ImageUpdatesModal from 'components/common/ImageUpdatesModal';
import { HOME } from 'components/routing';
import logo from 'resources/logo.png';
import { DockerStatus, LocaleSwitch, ThemeSwitch } from './';
import CheckForUpdatesButton from './CheckForUpdatesButton';

const { Header, Content, Footer } = Layout;

const Styled = {
  Layout: styled(Layout)`
    min-height: 100vh;
    overflow: hidden;
  `,
  Header: styled(Header)`
    padding: 0 16px;
    display: flex;
    justify-content: space-between;
  `,
  Logo: styled.div`
    height: 64px;
    width: 120px;
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

/**
 * Override some antd styled globally
 */
const AntdOverrides: React.FC = () => {
  const theme = useTheme();
  return (
    <Global
      styles={css`
        //--- antd overrides ---
        .ant-form-item-label {
          margin-bottom: 5px;
        }
        .ant-form-item-with-help {
          margin-bottom: 12px;
        }
        .ant-alert {
          margin-bottom: 16px;
        }
        .ant-alert-info {
          background-color: ${theme.alert.background};
          border: 1px solid ${theme.alert.border};
        }
        .ant-badge-status-default {
          background-color: ${theme.statusBadge.default};
        }
        .polar-context-menu {
          width: 200px;

          .ant-dropdown-menu-title-content {
            margin: -5px -12px;
            padding: 5px 12px;
            display: block;

            svg {
              margin-right: 5px;
            }
          }
        }
      `}
    />
  );
};

const AppLayout: React.FC<Props> = (props: Props) => {
  const { initialized } = useStoreState(s => s.app);
  const { imageUpdates } = useStoreState(s => s.modals);
  const { hideImageUpdates } = useStoreActions(s => s.modals);
  const theme = useTheme();
  return (
    <Styled.Layout>
      <AntdOverrides />
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
          <CheckForUpdatesButton />
          <LocaleSwitch />
          <ThemeSwitch />
        </Styled.FooterToggles>
      </Styled.Footer>
      {imageUpdates.visible && <ImageUpdatesModal onClose={hideImageUpdates} />}
    </Styled.Layout>
  );
};

export default AppLayout;
