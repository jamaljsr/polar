import React from 'react';
import { Link } from 'react-router-dom';
import styled from '@emotion/styled';
import { Layout } from 'antd';
import { NavMenu } from 'components/common';
import { HOME } from 'components/routing';
import logo from 'resources/logo.png';
import LocaleSwitch from './LocaleSwitch';

const { Header, Content, Footer } = Layout;

const StyledLayout = styled(Layout)`
  min-height: 100vh;
`;

const StyledHeader = styled(Header)`
  padding: 0 16px;
`;

const StyledLogo = styled.div`
  height: 64px;
  width: 120px;
  float: left;

  img {
    height: 16px;
    display: inline-block;
    vertical-align: middle;
    margin-right: 5px;
  }

  span {
    display: inline-block;
    color: #fff;
    font-weight: 600;
    font-size: 18px;
    vertical-align: middle;
  }
`;

const StyledContent = styled(Content)`
  display: flex;
`;

const StyledFooter = styled(Footer)`
  text-align: center;
  padding: 0 50px;
`;

interface Props {
  children: React.ReactNode;
}

const AppLayout: React.FC<Props> = (props: Props) => {
  return (
    <StyledLayout>
      <StyledHeader>
        <StyledLogo>
          <Link to={HOME}>
            <img src={logo} alt="logo" />
            <span>Polar</span>
          </Link>
        </StyledLogo>
        <NavMenu />
      </StyledHeader>
      <StyledContent>{props.children}</StyledContent>
      <StyledFooter>
        Polar &copy; 2019 Fomo Bros <LocaleSwitch />
      </StyledFooter>
    </StyledLayout>
  );
};

export default AppLayout;
