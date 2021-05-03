import React from "react";

import { DownloadOutlined, SelectOutlined } from '@ant-design/icons';

import { Outlet, useLocation } from 'react-router-dom';
import Header from "../components/Header";

import styled from "styled-components";

const Content = styled.div`
  min-height: calc(100% - 166px);
`;

const Footer = styled.div`
  .container {
    line-height: 20px;
    border-top: 1px solid #eee;
    display: flex;
    font-size: 13px;
    padding: 15px 0;
    justify-content: space-between;
    color: #9c9c9c;
    a {
      color: #9c9c9c;
    }
    a:hover {
      text-decoration: underline;
    }
  }
  
`;

function Main(): React.ReactElement {
  const location = useLocation();
  let pathname = location.pathname.split('/')[1];

  return (
    <>
      <Header />
      <Content style={{
        minHeight: pathname == 'home' ? 'calc(100% - 91px)' : 'calc(100% - 166px)',
        paddingBottom: '30px'
      }}>
        <Outlet />
      </Content>
      <Footer>
        <div className="container">
          <div style={{ display: 'flex' }}>
            <div>
              <p>Copyright &copy; 2021 <a href="https://www.oct.network">Octopus Network</a></p>
              <p><a>Term of service</a> | <a>Privacy policy</a></p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', flexDirection: 'column' }}>
            <p>
              <span>Relay contract: </span>
              <a target="_blank" href={`${window.nearConfig.explorerUrl}/accounts/${window.contractName}`}>
                {window.contractName}
              </a>
            </p>
            <p>
              <span>Token contract: </span>
              <a target="_blank" href={`${window.nearConfig.explorerUrl}/accounts/${window.tokenContractName}`}>
                {window.tokenContractName}
              </a>
            </p>
            <p>
              <span>Chainspec snippet: </span>
              <a target="_blank" href="https://storage.googleapis.com/dl-testnet/chainspec-snippet.json">
                Download <DownloadOutlined />
              </a>
            </p>
          </div>
        </div>
      </Footer>
    </>
  );
}

export default React.memo(Main);