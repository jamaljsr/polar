import React from 'react';
import { Link } from 'react-router-dom';
import styled from '@emotion/styled';
import { Layout } from 'antd';
import { NavMenu } from 'components/common';
import { HOME } from 'components/routing';
import logo from 'resources/logo.png';
import LocaleSwitch from './LocaleSwitch';

const { Header, Content, Footer } = Layout;

const Styled = {
  Layout: styled(Layout)`
    min-height: 100vh;
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
    margin-right: 5px;
  `,
  Brand: styled.span`
    display: inline-block;
    color: #fff;
    font-weight: 600;
    font-size: 18px;
    vertical-align: middle;
  `,
  Content: styled(Content)`
    display: flex;
  `,
  Footer: styled(Footer)`
    text-align: center;
    padding: 0 50px;
  `,
};

interface Props {
  children: React.ReactNode;
}

const AppLayout: React.FC<Props> = (props: Props) => {
  return (
    <Styled.Layout>
      <Styled.Header>
        <Styled.Logo>
          <Link to={HOME}>
            <Styled.Image src={logo} alt="logo" />
            <Styled.Brand>Polar</Styled.Brand>
          </Link>
        </Styled.Logo>
        <NavMenu />
      </Styled.Header>
      <Styled.Content>{props.children}</Styled.Content>
      <Styled.Footer>
        Polar &copy; 2019 Fomo Bros <LocaleSwitch />
      </Styled.Footer>
    </Styled.Layout>
  );
};

export default AppLayout;
