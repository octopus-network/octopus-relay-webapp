import React, { useCallback, useState, useEffect } from "react";

import { Button, Menu, Dropdown } from "antd";
import { RightOutlined, UserOutlined } from "@ant-design/icons";

import styled from "styled-components";

import TokenBadge from "../components/TokenBadge";
import logo from "../assets/logo.png";

import { Link, useLocation } from "react-router-dom";

const Wrapper = styled.div`
  position: relative;
  z-index: 1;
  .container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  .left {
    display: flex;
    align-items: center;
    .logo {
      display: inline-block;
      width: 130px;
      img {
        display: block;
        width: 100%;
        height: auto;
      }
    }
    .menu {
      margin-left: 50px;
      .ant-menu-item {
        border-bottom: none;
        a {
          display: inline-block;
          padding: 15px 0;
          color: rgba(255, 255, 255, 0.5);
        }
      }

      .ant-menu-item-selected {
        a {
          color: rgba(255, 255, 255, 1);
        }
      }
    }
  }
  .ant-btn-primary {
    border: 1px solid rgba(255, 255, 255, 0);
    background: rgba(255, 255, 255, 0.2);
  }
  .ant-btn-primary:hover {
    background: rgba(255, 255, 255, 0.3);
  }
  .avatar {
    cursor: pointer;
    background: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.8);
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
    transition: background 0.5s ease;
    &:focus {
      background: rgba(255, 255, 255, 0.4);
      color: rgba(255, 255, 255, 1);
    }
  }
`;

import { login, logout } from "../utils";

function Header(): React.ReactElement {
  const [accountBalance, setAccountBalance] = useState<String>("0");
  const location = useLocation();

  let pathname = location.pathname.split("/")[1];

  const menu = (
    <Menu>
      <Menu.Item>
        <Link to="/wallet">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{window.accountId}</span>
            <RightOutlined
              style={{ marginLeft: "10px", fontSize: "14px", color: "#ccc" }}
            />
          </div>
        </Link>
      </Menu.Item>

      <Menu.Item onClick={logout}>Sign Out</Menu.Item>
    </Menu>
  );

  useEffect(() => {
    if (!window.accountId) return;
    window.tokenContract
      ?.ft_balance_of({
        account_id: window.accountId,
      })
      .then((data) => {
        setAccountBalance(data);
      });
  }, [window.accountId]);

  return (
    <Wrapper
      style={{
        background: pathname == "home" ? "transparent" : "#030e21",
      }}
    >
      <div className="container">
        <div className="left">
          <Link to="/" className="logo">
            <img src={logo} />
          </Link>
          <div className="menu">
            <Menu
              mode="horizontal"
              style={{ borderBottom: "none", background: "transparent" }}
              selectedKeys={[pathname]}
            >
              <Menu.Item key="home">
                <Link to="/home">Home</Link>
              </Menu.Item>
              <Menu.Item key="appchains">
                <Link to="/appchains">Appchains</Link>
              </Menu.Item>
              <Menu.Item key="bridge">
                <a href="https://birdge.oct.network" target="_blank">Bridge</a>
              </Menu.Item>
              <Menu.Item key="docs">
                <a
                  href="https://github.com/octopus-network/pallet-octopus-appchain#octopus-appchain-pallet"
                  target="_blank"
                >
                  Docs
                </a>
              </Menu.Item>
              <Menu.Item key="guide">
                <a
                  href="https://github.com/octopus-network/pallet-octopus-appchain/blob/master/docs/Appchain_Guide.md"
                  target="_blank"
                >
                  Guide
                </a>
              </Menu.Item>
            </Menu>
          </div>
        </div>
        <div className="right">
          {window.walletConnection?.isSignedIn() ? (
            <div
              style={{
                display: "flex",
                flexDirection: "row",
              }}
            >
              {/* <Dropdown overlay={menu}>
                <div>
                  <span><UserOutlined /> { window.accountId }</span>
                  <span style={{ marginLeft: "5px", color: "#9c9c9c" }}>
                    <CaretDownOutlined />
                  </span>
                </div>
              </Dropdown>
              <span style={{ marginLeft: "10px", color: "#6c6c6c" }}>{accountBalance} <TokenBadge /></span> */}
              <Dropdown
                overlay={menu}
                placement="bottomRight"
                overlayStyle={{
                  width: "200px",
                }}
                trigger={["click"]}
              >
                <button className="avatar">
                  <UserOutlined style={{ fontSize: "20px" }} />
                </button>
              </Dropdown>
            </div>
          ) : (
            <Button type="primary" onClick={login}>
              <UserOutlined /> Sign In
            </Button>
          )}
        </div>
      </div>
    </Wrapper>
  );
}

export default React.memo(Header);
