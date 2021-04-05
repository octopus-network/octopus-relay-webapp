import React, { useCallback, useState, useEffect } from "react";

import { Button, Menu, Dropdown } from "antd";
import { RightOutlined, UserOutlined } from "@ant-design/icons";

import styled from "styled-components";

import TokenBadge from "../components/TokenBadge";
import logo from "../assets/logo.png";

import { Link } from "react-router-dom";

const Wrapper = styled.div`
  background: #fff;
  box-shadow: 0 2px 5px #f0f1f2;
  .container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding: 15px;
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
  .avatar {
    cursor: pointer;
    background: rgba(83,171,144,.2);
   
    color: #53ab90;
    border-radius: 50%;
    border-width: 2px;
    border-style: solid;
    border-color: transparent;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    outline: none;
    transition: background .5s ease;
    &:focus {
      background: #fff;
      border-color: #53ab90;
    }
  }
`;

import { login, logout } from "../utils";


function Header(): React.ReactElement {

  const [accountBalance, setAccountBalance] = useState<String>('0');

  const menu = (
    <Menu>
      <Menu.Item>
        <Link to="/wallet">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{ window.accountId }</span>
          <RightOutlined style={{ marginLeft: '10px', fontSize: '14px', color: '#ccc' }} />
        </div>
        </Link>
      </Menu.Item>
      
      <Menu.Item onClick={logout}>
        Sign Out
      </Menu.Item>
    </Menu>
  );

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
          <Link to="/">
            <a className="logo"><img src={logo} /></a>
          </Link>
        </div>
        <div className="right">
          {
            window.walletConnection?.isSignedIn() ?
            <div style={{
              display: "flex",
              flexDirection: "row"
            }}>
              {/* <Dropdown overlay={menu}>
                <div>
                  <span><UserOutlined /> { window.accountId }</span>
                  <span style={{ marginLeft: "5px", color: "#9c9c9c" }}>
                    <CaretDownOutlined />
                  </span>
                </div>
              </Dropdown>
              <span style={{ marginLeft: "10px", color: "#6c6c6c" }}>{accountBalance} <TokenBadge /></span> */}
              <Dropdown overlay={menu} placement="bottomRight" overlayStyle={{
                width: '200px'
              }} trigger={['click']}>
                <button className="avatar">
                  <UserOutlined style={{ fontSize: '20px' }} />
                </button>
              </Dropdown>
            </div> :
            <Button type="primary" onClick={login}><UserOutlined /> Sign In</Button>
          }
          
        </div>
      </div>
    </Wrapper>
  );
}

export default React.memo(Header);