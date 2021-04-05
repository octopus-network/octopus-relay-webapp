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
    line-height: 20px;
    padding: 15px;
    display: flex;
    font-size: 12px;
    justify-content: space-between;
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
          <div style={{ display: 'flex' }}>
           
            <div>
              <p>Copyright &copy; 2021 <a href="https://www.oct.network">Octopus Network</a></p>
              <p><a>Term of service</a> | <a>Privacy Policy</a></p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', flexDirection: 'column' }}>
            <p>Contract: <a>{ window.contractName }</a></p>
            <p>Token Contract: <a>{ window.tokenContractName }</a></p>
          </div>
        </div>
      </Footer>
    </>
  );
}

export default React.memo(Main);