import React, { useCallback, useState, useEffect } from "react";

import { Button, Menu, Dropdown } from "antd";
import { CaretDownOutlined, UserOutlined } from "@ant-design/icons";

import styled from "styled-components";

import TokenBadge from "../components/TokenBadge";
import logo from "../assets/logo.png";

const Wrapper = styled.div`
  background: #fff;
  box-shadow: 0 2px 5px #f0f1f2;
  .container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding: 15px 20px;
    align-items: center;
  }
  .logo {
    display: inline-block;
    width: 120px;
    img {
      display: block;
      width: 100%;
      height: auto;
    }
  }
`;

import { login, logout } from "../utils";

const menu = (
  <Menu>
    <Menu.Item onClick={logout}>
      Sign Out
    </Menu.Item>
  </Menu>
);

function Header(): React.ReactElement {

  const [accountBalance, setAccountBalance] = useState<String>('0');

  useEffect(() => {
    if (!window.accountId) return;
    window.tokenContract?.ft_balance_of({
      account_id: window.accountId
    }).then(data => {
      setAccountBalance(data);
    });

  }, [window.accountId]);

  return (
    <Wrapper>
      <div className="container">
        <div className="left">
          <a className="logo" href=".">
            <img src={logo} />
          </a>
        </div>
        <div className="right">
          {
            window.walletConnection?.isSignedIn() ?
            <div style={{
              display: "flex",
              flexDirection: "row"
            }}>
              <Dropdown overlay={menu}>
                <div>
                  <span><UserOutlined /> { window.accountId }</span>
                  <span style={{ marginLeft: "5px", color: "#9c9c9c" }}>
                    <CaretDownOutlined />
                  </span>
                </div>
              </Dropdown>
              <span style={{ marginLeft: "10px", color: "#6c6c6c" }}>{accountBalance} <TokenBadge /></span>
            </div> :
            <Button type="primary" onClick={login}><UserOutlined /> Sign In</Button>
          }
          
        </div>
      </div>
    </Wrapper>
  );
}

export default React.memo(Header);