import React, { useState, useEffect, useCallback } from "react";
import {
  Layout,
  Menu,
  Affix,
  Skeleton
} from 'antd';

import { 
  CodepenOutlined,
  TeamOutlined
} from "@ant-design/icons";

import { Link, useParams, Outlet, useLocation } from 'react-router-dom';
import { readableAppchain } from "../../utils";

import Status from '../../components/Status';

const { Content, Sider } = Layout;

function Appchain(): React.ReactElement {
  const { id } = useParams();
  const location = useLocation();

  const [appchain, setAppchain] = useState<any>();

  let pathname = location.pathname.split("/")[3];

  useEffect(() => {
    if (!id) return;
    window.contract
      .get_appchain({ appchain_id: id })
      .then(appchain => {
        setAppchain(readableAppchain(appchain));
      });
  
  }, [id]);

  return (
    <Layout>
      <Affix offsetTop={75}>
      <Sider width={320} style={{
        height: 'calc(100vh - 75px)', background: '#fff'
      }}>
        <div style={{ 
          padding: '20px', whiteSpace: 'nowrap', 
          textOverflow: 'ellipsis', overflow: 'hidden', display: 'flex',
          alignItems: 'center'
        }}>
          
          <h2 style={{ margin: '0 10px', fontSize: '24px', fontWeight: 600 }}>{id}</h2>
          {
            appchain ?
            <Status type={appchain?.status} /> :
            <Skeleton.Input active={true} style={{ width: 100 }} />
          }
        </div>
       
        <Menu
          mode="inline"
          defaultSelectedKeys={[pathname || 'overview']}
          style={{ borderRight: 0, borderTop: '1px solid #eee' }}
        >
          <Menu.Item key="overview">
            <Link to={`/appchains/${id}`}>
              <CodepenOutlined style={{ fontSize: '20px' }} /> Overview
            </Link>
          </Menu.Item>
          <Menu.Item key="validators">
            <Link to={`/appchains/${id}/validators`}>
              <TeamOutlined style={{ fontSize: '20px' }} /> Validators
            </Link>
          </Menu.Item>
        </Menu>
      </Sider>
      </Affix>
      <Content style={{
        padding: '20px'
      }}>
        <div style={{
          minHeight: 'calc(100vh - 225px)'
        }}>
          <Outlet />
        </div>
        <div style={{ padding: '20px', textAlign: 'center', color: '#9c9c9c', marginTop: '20px' }}>
          <p>Copyright © 2021 <a href="https://www.oct.network">Octopus Network</a></p>
        </div>
      </Content>
    </Layout>
  );
}

export default React.memo(Appchain);
