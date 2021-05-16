import React, { useEffect, useState, useRef } from 'react';
import { Modal, Input, Button, Row, Col, Table, Select, Space, Form, Tag, message } from 'antd';

import { ArrowRightOutlined, ArrowLeftOutlined } from '@ant-design/icons';

import axios from 'axios';

import { w3cwebsocket as W3CWebsocket } from 'websocket';

import styles from "./styles.less";

const apiHost = 'https://1fus85rip4.execute-api.ap-northeast-1.amazonaws.com';

const wsHost = 'wss://chuubnzu9i.execute-api.ap-northeast-1.amazonaws.com';

function DeployModal({ appchain, visible, onCancel }): React.ReactElement {

  const smallWidth = 520, bigWidth = 760;

  const [wsClient, setWSClient] = useState<any>();

  const [cloudVendorAndKey, setCloudVendorAndKey] = useState('');

  const [cloudVendor, setCloudVendor] = useState('aws');
  const [accessKey, setAccessKey] = useState('');
  const [deployingNew, setDeployingNew] = useState(false);

  const [taskList, setTaksList] = useState([]);

  const [modalWidth, setModalWidth] = useState(smallWidth);

  const [isDeploying, setIsDeploying] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);

  const [applying, setApplying] = useState({});
  const [destroying, setDestroying] = useState({});
  const [detailLoading, setDetailLoading] = useState({});

  const [deployLogs, setDeployLogs] = useState({});

  const [showLogUUID, setShowLogUUID] = useState('');

  const logBoxRef = useRef();

  useEffect(() => {
    if (visible) {
      let tmpKey = window.localStorage.getItem('cloud-vendor-and-access-key');
      setCloudVendorAndKey(tmpKey);
      if (tmpKey) {
        getTasks(tmpKey);
        initWSClient(tmpKey);
      }
    } else {
      setDeployingNew(false);
      setCloudVendorAndKey('');
      setAccessKey('');
      setCloudVendor('aws');
      setIsDeploying(false);
      setShowLogUUID('');
      if (wsClient) {
        wsClient.close();
      }
    }
  }, [visible]);

  useEffect(() => {
    setModalWidth(cloudVendorAndKey ? bigWidth : smallWidth);
  }, [cloudVendorAndKey]);

  const columns = [
    {
      title: 'UUID',
      key: 'UUID',
      dataIndex: 'uuid'
    },
    {
      title: 'State',
      key: 'state',
      dataIndex: 'state',
      render: (state) => {
        const states = {
          '0': { label: 'init', color: 'orange' },
          '10': { label: 'applying', color: 'blue' },
          '11': { label: 'apply failed', color: 'red' },
          '12': { label: 'apply success', color: 'green' },
          '20': { label: 'destroying', color: 'cyan' },
          '21': { label: 'destoryed', color: 'magenta' },
          '22': { label: 'destoryed', color: 'magenta' }
        }
        return <Tag color={states[state].color}>{states[state] ? states[state].label : state}</Tag>
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (record) => {
        const { uuid, state } = record;
        const isApplying = applying[uuid];
        const isDestroying = destroying[uuid];

        const isLoadingDetail = detailLoading[uuid];

        return (
          <Space>
            {
              (state == '0' || state == '11') && 
              <Button loading={isApplying} onClick={() => onApply(uuid)}>Apply</Button>
            }
            {
              (state == '12') &&
              <Button loading={isDestroying} onClick={() => onDestroying(uuid)}>Destroy</Button>
            }
            {
              (state == '10' || state == '20') &&
              <Button loading={isLoadingDetail} onClick={() => onShowLog(uuid)}>Deploy Log</Button>
            }
          </Space>
        );
      }
    }
  ];

  const onAccess = () => {
    let vendorAndKey = cloudVendor + '-' + accessKey;
    window.localStorage.setItem('cloud-vendor-and-access-key', vendorAndKey);
    setCloudVendorAndKey(vendorAndKey);
    setModalWidth(bigWidth);
    getTasks(vendorAndKey);
  }

  const onLogout = () => {
    window.localStorage.removeItem('cloud-vendor-and-access-key');
    setCloudVendorAndKey('');
    setAccessKey('');
  }

  const onDeployNew = () => {
    setDeployingNew(true);
    setModalWidth(smallWidth);
  }

  const onCancelDeploy = () => {
    setDeployingNew(false);
    setIsDeploying(false);
    setModalWidth(bigWidth);
    getTasks();
  }

  const getTasks = async (auth = '') => {
    setIsLoadingList(true);

    try {
      const res = await axios({
        method: 'get',
        url: `${apiHost}/api/tasks`,
        headers: { authorization: auth || cloudVendorAndKey }
      }).then(res => res.data);

      console.log(res)
      setTaksList(res);
    } catch(err) {
      console.log(err);
    }

    setIsLoadingList(false);
  }

  const onDeploy = async (fields) => {
    setIsDeploying(true);

    const { cloudVendor, accessKey, accessSecret } = fields;

    if (!cloudVendor||!accessKey||!accessSecret) {
      return message.error('Fields missed!');
    }

    const { chain_spec_url, chain_spec_hash, boot_nodes } = appchain;

    try {

      const res = await axios({
        method: 'post',
        url: `${apiHost}/api/tasks`,
        headers: { authorization: cloudVendorAndKey },
        data: {
          chainspec_url: chain_spec_url,
          chainspec_checksum: 'sha256:' + chain_spec_hash,
          bootnodes: boot_nodes ? boot_nodes.replaceAll(/(\[|\]|")/g, '').split(',').filter(a => a.replaceAll(/\s/g, '')) : [],
          cloud_vendor: cloudVendor,
          access_key: accessKey,
          secret_key: accessSecret,
        }
      }).then(res => res.data);

      message.success('Deploy init success!');
      console.log(res);

      onCancelDeploy();

    } catch(err) {
      console.log(err);
    }

    setIsDeploying(false);
  }

  const onApply = async (uuid) => {
    setApplying({ ...applying, [uuid]: true });

    try {

      const res = await axios({
        method: 'put',
        url: `${apiHost}/api/tasks/${uuid}`,
        headers: { authorization: cloudVendorAndKey },
        data: { action: 'apply' }
      }).then(res => res.data);
      console.log(res);

      message.success('Apply success!');
      getTasks();
    } catch(err) {
      message.error('Apply error!');
      console.log(err);
    }

    setApplying({ ...applying, [uuid]: false });
  }

  const onDestroying = async (uuid) => {
    setDestroying({ ...destroying, [uuid]: true });

    try {

      const res = await axios({
        method: 'put',
        url: `${apiHost}/api/tasks/${uuid}`,
        headers: { authorization: cloudVendorAndKey },
        data: { action: 'destroy' }
      }).then(res => res.data);
      console.log(res);
      
      message.success('Destroy success!');
      getTasks();
    } catch(err) {
      message.error('Destroy error!');
      console.log(err);
    }

    setDestroying({ ...destroying, [uuid]: false });
  }

  const initWSClient = (auth) => {
    const client = new W3CWebsocket(`${wsHost}/api?token=${auth||cloudVendorAndKey}`);
    setWSClient(client);

    client.onerror = function(err) {
      console.log(err);
      console.log('ws error');
    };

    client.onopen = function() {
      console.log('ws open');
    }

    client.onclose = function() {
      console.log('ws close');
    }

    client.onmessage = function(e) {
      if (typeof e.data !== 'string') {
        return;
      }
      try {
        const res = JSON.parse(e?.data);
        
        const { uuid, data } = res;
        if (deployLogs[uuid]) {
          deployLogs[uuid].push(JSON.stringify(data));
        } else {
          deployLogs[uuid] = [JSON.stringify(data)];
        }
      } catch(e) { console.log(e) }
      setTimeout(() => {
        if (logBoxRef.current) {
          let ele = logBoxRef.current as any;
          if (!ele) return;
          ele.scrollTop = ele.scrollHeight;
        }
      }, 100);
    }
    
  }

  const onLoadDetail = async (uuid) => {
    setDetailLoading({ ...detailLoading, [uuid]: true });
    try {
      const res = await axios({
        method: 'get',
        url: `${apiHost}/api/tasks/${uuid}`,
        headers: { authorization: cloudVendorAndKey }
      }).then(res => res.data);

      console.log(res);
    } catch(err) {
      message.error('Load detail error');
      console.log(err);
    }

    setDetailLoading({ ...detailLoading, [uuid]: false });
  }

  const onShowLog = (uuid) => {
    setShowLogUUID(uuid);
  }

  const onHidLog = () => {
    setShowLogUUID('');
  }
 
  return (
    <Modal visible={visible} title={false} onCancel={onCancel} 
      destroyOnClose={true} footer={null} width={modalWidth} style={{ transition: 'width .3s ease' }}>
     
      {
        cloudVendorAndKey ?
        <div>
          {
            showLogUUID ?
            <div>
              <div style={{ display: 'flex', alignItems: 'cemter' }}>
                <Button onClick={onHidLog} style={{ marginRight: '15px' }}><ArrowLeftOutlined /> Back</Button>
                <h3 style={{ fontSize: '20px' }}>Deploy Log</h3>
              </div>
              <div className={styles.deployLog} ref={logBoxRef}>
                <p className={styles.logLine}>Polling {showLogUUID} logs...</p>
                {
                  deployLogs[showLogUUID] && deployLogs[showLogUUID].map((line, idx) => {
                    return (
                      <p className={styles.logLine} key={idx}>{line}</p>
                    );
                  })
                }
              </div>
            </div> :
            <>
            <div style={{ marginBottom: '20px' }}>
              {
                deployingNew ?
                <h3 style={{ fontSize: '20px' }}>Deploy New Validator</h3> :
                <h3 style={{ fontSize: '20px' }}>Cloud / { cloudVendorAndKey?.split('-')[0].toUpperCase() }</h3>
              }
              {
                !deployingNew &&
                <Row align="middle">
                  <Col flex={1}>
                    <span style={{ fontSize: '14px', color: '#9c9c9c' }}>Access Key:</span>
                    <span style={{ fontSize: '14px', marginLeft: '10px' }}>{ cloudVendorAndKey?.split('-')[1] }</span>
                  </Col>
                  <Col>
                    <Space>
                      <Button type="primary" onClick={onDeployNew}>Deploy New</Button>
                      <Button onClick={onLogout}>Logout</Button>
                    </Space>
                  </Col>
                </Row>
              }
            </div>
            <div style={{ marginTop: '30px' }}>
              {
                deployingNew ?
                <Form layout="horizontal" labelCol={{ span: 6 }} labelAlign="left" onFinish={onDeploy} initialValues={{
                  cloudVendor: cloudVendorAndKey ? cloudVendorAndKey.split('-')[0] : '',
                  accessKey: cloudVendorAndKey ? cloudVendorAndKey.split('-')[1] : ''
                }}>
                  <Form.Item label="Coud Vendor" name="cloudVendor">
                    <Input placeholder="Cloud vendor" disabled size="large" />
                  </Form.Item>
                  <Form.Item label="Access Key" name="accessKey">
                    <Input placeholder="Cloud access key" disabled size="large" />
                  </Form.Item>
                  <Form.Item label="Access Secret" required name="accessSecret" rules={[
                    { required: true, message: 'Please input your access secret' }
                  ]}>
                    <Input.Password placeholder="Cloud access secret" size="large" />
                  </Form.Item>
                  <Form.Item>
                    <Row justify="end">
                      <Space>
                        <Button type="primary" size="large" htmlType="submit" 
                          loading={isDeploying} disabled={isDeploying}>Deploy</Button>
                        <Button size="large" onClick={onCancelDeploy}>Cancel</Button>
                      </Space>
                    </Row>
                  </Form.Item>
                </Form> :
                <Table columns={columns} loading={isLoadingList} dataSource={taskList} rowKey={(record) => record.uuid} />
              }
            </div>
          </>
          }
        </div> :
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '25px', fontWeight: 600, fontSize: '20px', width: '320px' }}>
            <span>Choose your cloud vendor and input the access key</span>
          </div>
          <Row align="middle" justify="space-between" gutter={20}>
            <Col flex={1} style={{ border: '1px solid #53ab90', borderRadius: '25px' }}>
              <Row>
                <Col>
                  <Select placeholder="Cloud vendor" defaultValue="aws" size="large" bordered={false} onChange={v => setCloudVendor(v)}>
                    <Select.Option value='aws'>AWS</Select.Option>
                  </Select>
                </Col>
                <Col flex={1}>
                  <Input onChange={e => setAccessKey(e.target.value)} placeholder="Access key" bordered={false}
                    size="large" style={{ borderRadius: '25px' }} />
                </Col>
              </Row>
            </Col>
            <Col>
              <Button size="large" type="primary" onClick={onAccess} disabled={!accessKey}>
                Enter <ArrowRightOutlined />
              </Button>
            </Col>
          </Row>
        </div>
      }
     
    </Modal>
  );
}

export default React.memo(DeployModal);

