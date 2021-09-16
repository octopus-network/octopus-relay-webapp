import React from "react";

import { Affix } from 'antd';
import { Outlet, useLocation } from 'react-router-dom';
import Header from "../components/Header";
import Footer from "../components/Footer";

import styled from "styled-components";

const Content = styled.div`
  min-height: calc(100% - 166px);
`;

function Main(): React.ReactElement {
  const location = useLocation();
  let pathname = location.pathname.split('/')[1];

  const isInAppchain = /^\/appchains\/.*$/i.test(location.pathname);

  return (
    <>
      {
        isInAppchain ?
        <Affix>
          <Header />
        </Affix> :
        <Header />
      }
      
      <Content style={{
        minHeight: pathname == 'home' ? 'calc(100% - 91px)' : 'calc(100% - 166px)',
        paddingBottom: isInAppchain ? '0' : '30px'
      }}>
        <Outlet />
      </Content>
      {
        !isInAppchain &&
        <Footer />
      }
    </>
  );
}

export default React.memo(Main);