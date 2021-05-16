import React, { useEffect, useState, useRef } from 'react';
import { Modal, Input, Button, Row, Col, Table, Select, Space, Form, Tag, message } from 'antd';

import { ArrowRightOutlined, LeftOutlined, VerticalAlignBottomOutlined } from '@ant-design/icons';

import axios from 'axios';

import { w3cwebsocket as W3CWebsocket } from 'websocket';

import styles from "./styles.less";

const apiHost = 'https://1fus85rip4.execute-api.ap-northeast-1.amazonaws.com';

const wsHost = 'wss://chuubnzu9i.execute-api.ap-northeast-1.amazonaws.com';

function getCloudVendorKey(appchainId, cloudVendor, accessKey) {
  return `appchain-${appchainId}-cloud-${cloudVendor}-${accessKey}`;
}

function getLocalStorageKey(appchainId) {
  return `cloud-vendor-key-appchain-${appchainId}`;
}

function getCloudVendor(vendorKey) {
  return (vendorKey||'-').split('-')[3]||'';
}

function getAccessKey(vendorKey) {
  return (vendorKey||'-').split('-').pop();
}

function DeployModal({ appchain, visible, onCancel }): React.ReactElement {

  const smallWidth = 520, bigWidth = 960;

  const [wsClient, setWSClient] = useState<any>();

  const [cloudVendorKey, setCloudVendorKey] = useState('');

  const [cloudVendor, setCloudVendor] = useState('aws');
  const [accessKey, setAccessKey] = useState('');
  const [deployingNew, setDeployingNew] = useState(false);

  const [taskList, setTaksList] = useState([]);

  const [modalWidth, setModalWidth] = useState(smallWidth);

  const [isDeploying, setIsDeploying] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);

  const [isWSReady, setIsWSReady] = useState(false);

  const [applying, setApplying] = useState({});
  const [destroying, setDestroying] = useState({});
  const [detailLoading, setDetailLoading] = useState({});
  const [deleting, setDeleting] = useState({});

  const [deployLogs, setDeployLogs] = useState({});

  const [showLogUUID, setShowLogUUID] = useState('');

  const logBoxRef = useRef();

  useEffect(() => {
    if (visible) {
      let tmpKey = window.localStorage.getItem(getLocalStorageKey(appchain.id));
      setCloudVendorKey(tmpKey);
      if (tmpKey) {
        getTasks(tmpKey);
        initWSClient(tmpKey);
      }
    } else {
      setDeployingNew(false);
      setCloudVendorKey('');
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
    setModalWidth(cloudVendorKey ? bigWidth : smallWidth);
  }, [cloudVendorKey]);

  const columns = [
    {
      title: 'UUID',
      key: 'uuid',
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
      title: 'Instance',
      key: 'instance',
      render: (record) => {
        const { instance } = record;
        if (!instance) {
          return <span>Not Ready</span>
        }
        return (
          <span>{instance.user}@{instance.ip}</span>
        );
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
        const isDeleting = deleting[uuid];

        return (
          <Space>
            {
              (state == '0') && 
              <Button loading={isApplying} onClick={() => onApply(uuid)}>Apply</Button>
            }
            {
              (state == '12') &&
              <>
              <Button loading={isDestroying} onClick={() => onDestroy(uuid)}>Destroy</Button>
              <Button href={record.instance.ssh_key} icon={<VerticalAlignBottomOutlined />}>RSA</Button>
              </>
            }
            {
              (state == '10' || state == '20') &&
              <Button loading={isLoadingDetail} onClick={() => onShowLog(uuid)}>Deploy Log</Button>
            }
            {
              (state == '11' || state == '21' || state == '22') &&
              <Button loading={isDeleting} onClick={() => onDelete(uuid)}>Delete</Button>
            }
          </Space>
        );
      }
    }
  ];

  const onAccess = () => {
    let vendorKey = getCloudVendorKey(appchain.id, cloudVendor, accessKey);

    window.localStorage.setItem(getLocalStorageKey(appchain.id), vendorKey);
    setCloudVendorKey(vendorKey);
    setModalWidth(bigWidth);
    getTasks(vendorKey);
  }

  const onLogout = () => {
    window.localStorage.removeItem(getLocalStorageKey(appchain.id));
    setCloudVendorKey('');
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
        headers: { authorization: auth || cloudVendorKey }
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
        headers: { authorization: cloudVendorKey },
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
        headers: { authorization: cloudVendorKey },
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

  const onDestroy = async (uuid) => {
    setDestroying({ ...destroying, [uuid]: true });

    try {

      const res = await axios({
        method: 'put',
        url: `${apiHost}/api/tasks/${uuid}`,
        headers: { authorization: cloudVendorKey },
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

  const onDelete = async (uuid) => {
    setDeleting({ ...deleting, [uuid]: true });

    try {

      const res = await axios({
        method: 'DELETE',
        url: `${apiHost}/api/tasks/${uuid}`,
        headers: { authorization: cloudVendorKey }
      }).then(res => res.data);
      console.log(res);
      
      message.success('Delete success!');
      getTasks();
    } catch(err) {
      message.error('Delete error!');
      console.log(err);
    }

    setDeleting({ ...deleting, [uuid]: false });
  }

  const initWSClient = (auth) => {
    const client = new W3CWebsocket(`${wsHost}/api?token=${auth||cloudVendorKey}`);
    setWSClient(client);

    client.onerror = function(err) {
      console.log(err);
      console.log('ws error');
      setIsWSReady(false);
    };

    client.onopen = function() {
      console.log('ws open');
      setIsWSReady(true);
    }

    client.onclose = function() {
      console.log('ws close');
      setIsWSReady(false);
    }

    client.onmessage = function(e) {
      if (typeof e.data !== 'string') {
        return;
      }
      let tmpLogs = deployLogs;
      try {
        const res = JSON.parse(e?.data);
        const { uuid, data } = res;
        if (tmpLogs[uuid]) {
          tmpLogs[uuid].push(JSON.stringify(data));
        } else {
          tmpLogs[uuid] = [JSON.stringify(data)];
        }
      } catch(e) { console.log(e) }
      setTimeout(() => {
        if (logBoxRef.current) {
          setDeployLogs(tmpLogs);
          let ele = logBoxRef.current as any;
          if (!ele) return;
          ele.scrollTop = ele.scrollHeight;
        }
      }, 300);
    }
    
  }

  const onLoadDetail = async (uuid) => {
    setDetailLoading({ ...detailLoading, [uuid]: true });
    try {
      const res = await axios({
        method: 'get',
        url: `${apiHost}/api/tasks/${uuid}`,
        headers: { authorization: cloudVendorKey }
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
    getTasks();
  }
 
  return (
    <Modal visible={visible} title={false} onCancel={onCancel} 
      destroyOnClose={true} footer={null} width={modalWidth} style={{ transition: 'width .3s ease' }}>
     
      {
        cloudVendorKey ?
        <div>
          {
            showLogUUID ?
            <div>
              <div style={{ display: 'flex', alignItems: 'cemter' }}>
                <Button onClick={onHidLog} style={{ marginRight: '15px' }} type="primary" icon={<LeftOutlined />} />
                <h3 style={{ fontSize: '20px' }}>Deploy Log</h3>
              </div>
              <div className={styles.deployLog} ref={logBoxRef}>
                <p className={styles.logLine}>Polling {showLogUUID} logs...</p>
                {
                  !isWSReady &&
                  <p className={styles.logLine}>Websocket is not ready, please try to refresh this page.</p>
                }
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
                <h3 style={{ fontSize: '20px' }}>Cloud / { getCloudVendor(cloudVendorKey) }</h3>
              }
              {
                !deployingNew &&
                <Row align="middle">
                  <Col flex={1}>
                    <span style={{ fontSize: '14px', color: '#9c9c9c' }}>Access Key:</span>
                    <span style={{ fontSize: '14px', marginLeft: '10px' }}>{ getAccessKey(cloudVendorKey) }</span>
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
                  cloudVendor: getCloudVendor(cloudVendorKey),
                  accessKey: getAccessKey(cloudVendorKey)
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
                <Table columns={columns} loading={isLoadingList} dataSource={taskList} 
                  scroll={{ x: 900 }} rowKey={(record) => record.uuid} />
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

