import React from 'react';
import styled from "styled-components";

const Wrap = styled.div`
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

const Footer = () => {
  return (
    <Wrap>
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
          
        </div>
      </div>
    </Wrap>
  );
}

export default Footer;