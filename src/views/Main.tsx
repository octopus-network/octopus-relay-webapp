import React from "react";

import { Outlet } from 'react-router-dom';
import Header from "../components/Header";

import styled from "styled-components";

const Content = styled.div`
  .container {
    padding: 15px;
  }
`;

const Footer = styled.div`
  .container {
    padding: 15px;
    text-align: center;
    color: #9c9c9c;
    a:hover {
      text-decoration: underline;
    }
  }
`;


function Main(): React.ReactElement {
  return (
    <>
      <Header />
      <Content>
        <div className="container">
          <Outlet />
        </div>
      </Content>
      <Footer>
        <div className="container">
          Copyright &copy; 2021 <a href="https://github.com/octopus-network">Octopus Network</a>
        </div>
      </Footer>
    </>
  );
}

export default React.memo(Main);