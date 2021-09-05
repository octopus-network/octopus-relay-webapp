import React, { useEffect, useState, useRef } from 'react';
import { 
  Modal, Input, Button, Row, Col, Table, Select, Space, Form, Tag, message 
} from 'antd';

import { ArrowRightOutlined, LeftOutlined, VerticalAlignBottomOutlined } from '@ant-design/icons';

import axios from 'axios';

import { w3cwebsocket as W3CWebsocket } from 'websocket';

import styles from "./styles.less";

const apiHost = 'https://1fus85rip4.execute-api.ap-northeast-1.amazonaws.com';

const wsHost = 'wss://chuubnzu9i.execute-api.ap-northeast-1.amazonaws.com';

function getCloudVendorKey(appchainId, cloudVendor, accessKey) {
  appchainId = appchainId.replaceAll('-', '_');
  return `appchain-${appchainId}-cloud-${cloudVendor}-${accessKey}`;
}

const baseImages = [
  {
    image: 'gcr.io/octopus-dev-309403/substrate-octopus@sha256:5b4694fa7bf522fee76ecd607a76e312b19757005977de4c7c0c2c9869e31934',
    label: 'Substrate 0.9.8'
  }
]

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

  const [isApplying, setIsApplying] = useState(false);
  const [isDestroying, setIsDestroying] = useState(false);
  const [isOnApply, setIsOnApply] = useState(false);
  const [inputedSecretKey, setInputedSecretKey] = useState('');

  const [selectedUUID, setSelectedUUID] = useState('');
  const [destroying, setDestroying] = useState({});
  const [detailLoading, setDetailLoading] = useState({});
  const [deleting, setDeleting] = useState({});
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
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
          '21': { label: 'destroy failed', color: 'magenta' },
          '22': { label: 'destroyed', color: 'magenta' }
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
      title: 'Image',
      key: 'image',
      render: (record) => {
        const { task } = record;
        let baseImage = baseImages[0];
        for (let i = 0; i < baseImages.length; i++) {
          baseImage = baseImages[i];
          if (baseImage.image == task.base_image) {
            break;
          }
        }
       
        return (
          <span>{baseImage.label}</span>
        )
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (record) => {
        const { uuid, state } = record;
       
        const isDestroying = destroying[uuid];

        const isLoadingDetail = detailLoading[uuid];
        const isDeleting = deleting[uuid];

        return (
          <Space>
            {
              (state == '0') && 
              <Button onClick={() => {
                setInputedSecretKey('');
                setIsOnApply(true);
                setIsPasswordModalOpen(true);
                setSelectedUUID(uuid);
              }}>Apply</Button>
            }
            {
              (state == '11' || state == '21') &&
              <>
                <Button onClick={() => {
                  setInputedSecretKey('');
                  setIsOnApply(false);
                  setIsPasswordModalOpen(true);
                  setSelectedUUID(uuid);
                }}>Destroy</Button>
               
              </>
            }
            {
              (state == '12') &&
              <>
                <Button onClick={() => {
                  setIsOnApply(false);
                  setIsPasswordModalOpen(true);
                  setSelectedUUID(uuid);
                }}>Destroy</Button>
                <Button href={record.instance.ssh_key} icon={<VerticalAlignBottomOutlined />}>RSA</Button>
              </>
            }
            {
              (state == '10' || state == '20') &&
              <Button loading={isLoadingDetail} onClick={() => onShowLog(uuid)}>
                { state == '10' ? 'Deploy log' : 'Destroy log' }
              </Button>
            }
            {
              (state == '0' || state == '22') &&
              <Button loading={isDeleting} danger type="text" onClick={() => onDelete(uuid)}>Delete</Button>
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
    
    const { cloudVendor, accessKey, baseImage } = fields;

    if (!cloudVendor || !accessKey) {
      return message.error('Missing parameters!');
    }
    setIsDeploying(true);

    const { chain_spec_raw_url, chain_spec_raw_hash, boot_nodes } = appchain;

    try {

      const res = await axios({
        method: 'post',
        url: `${apiHost}/api/tasks`,
        headers: { authorization: cloudVendorKey },
        data: {
          chainspec_url: chain_spec_raw_url,
          chainspec_checksum: 'sha256:' + chain_spec_raw_hash,
          bootnodes: boot_nodes ? boot_nodes.replaceAll(/(\[|\]|")/g, '').split(',').filter(a => a.replaceAll(/\s/g, '')) : [],
          cloud_vendor: cloudVendor,
          access_key: accessKey,
          base_image: baseImage,
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

  const onApply = async () => {
    setIsApplying(true);
    
    try {
      const res = await axios({
        method: 'put',
        url: `${apiHost}/api/tasks/${selectedUUID}`,
        headers: { authorization: cloudVendorKey },
        data: { action: 'apply', secret_key: inputedSecretKey }
      }).then(res => res.data);
      console.log(res);

      message.success('Apply success!');
      getTasks();
    } catch(err) {
      message.error('Apply error!');
      console.log(err);
    }
    setIsPasswordModalOpen(false);
    setIsApplying(false);
  }

  const onDestroy = async (uuid) => {
    setIsDestroying(true);

    try {

      const res = await axios({
        method: 'put',
        url: `${apiHost}/api/tasks/${selectedUUID}`,
        headers: { authorization: cloudVendorKey },
        data: { action: 'destroy', secret_key: inputedSecretKey }
      }).then(res => res.data);
      console.log(res);
      
      message.success('Destroy success!');
      getTasks();
    } catch(err) {
      message.error('Destroy error!');
      console.log(err);
    }
    setIsPasswordModalOpen(false);
    setIsDestroying(false);
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
    <>
      <Modal visible={visible} title={false} onCancel={onCancel} zIndex={998}
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
                    accessKey: getAccessKey(cloudVendorKey),
                    baseImage: baseImages[0].image
                  }}>
                    <Form.Item label="Coud Vendor" name="cloudVendor">
                      <Input placeholder="Cloud vendor" disabled size="large" />
                    </Form.Item>
                    <Form.Item label="Access Key" name="accessKey">
                      <Input placeholder="Cloud access key" disabled size="large" />
                    </Form.Item>
                    {/* <Form.Item label="Access Secret" required name="accessSecret" rules={[
                      { required: true, message: 'Please input your access secret' }
                    ]}>
                      <Input.Password placeholder="Cloud access secret" size="large" />
                    </Form.Item> */}
                    <Form.Item label="Base Image" name="baseImage">
                      <Select size="large">
                        {
                          baseImages.map((baseImage, idx) => (
                            <Select.Option value={baseImage.image} key={`base-image-idx`}>{baseImage.label}</Select.Option>
                          ))
                        }
                      </Select>
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
      <Modal visible={isPasswordModalOpen} footer={null} destroyOnClose={true} zIndex={999}
        onCancel={() => setIsPasswordModalOpen(false)}>
        <div style={{ marginBottom: '25px', fontWeight: 600, fontSize: '18px' }}>
          <span>Input your secret key to apply</span>
        </div>  
        <Row align="middle" justify="space-between" gutter={20}>
          <Col flex={1} style={{ border: '1px solid #53ab90', borderRadius: '25px' }}>
            <Input placeholder="Please input your secret key" size="large" type="password" autoFocus={true}
              onChange={e => setInputedSecretKey(e.target.value)} defaultValue="" bordered={false} />
          </Col>
          <Col>
            <Button type="primary" htmlType="submit" onClick={isOnApply ? onApply : onDestroy} size="large"
              loading={isApplying || isDestroying} disabled={isApplying || isDestroying || !inputedSecretKey}>
                {isOnApply ? 'Apply' : 'Destroy'}
              </Button>
          </Col>
        </Row>
      </Modal>
    </>
  );
}

export default React.memo(DeployModal);

