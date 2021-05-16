import React, { useEffect, useState } from 'react';
import { Modal, Input, Button, Row, Col, Table, Select, Space, Form, Progress, message } from 'antd';

import { ArrowRightOutlined } from '@ant-design/icons';

import axios from 'axios';

const apiHost = 'https://1fus85rip4.execute-api.ap-northeast-1.amazonaws.com';

function DeployModal({ appchain, visible, onCancel }): React.ReactElement {

  const smallWidth = 520, bigWidth = 760;

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

  useEffect(() => {
    if (visible) {
      let tmpKey = window.localStorage.getItem('cloud-vendor-and-access-key');
      setCloudVendorAndKey(tmpKey);
      if (tmpKey) {
        getTasks();
      }
    } else {
      setDeployingNew(false);
      setCloudVendorAndKey('');
      setAccessKey('');
      setCloudVendor('aws');
      setIsDeploying(false);
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
      render: (text) => {
        const states = {
          '0': 'Ready',
          '1': ''
        }
        return <span>{states[text] || text}</span>
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (record) => {
        const { uuid } = record;
        const isApplying = applying[uuid];
        const isDestroying = destroying[uuid];

        return (
          <Space>
            <Button type="ghost" loading={isApplying} onClick={() => onApply(uuid)}>Apply</Button>
            <Button loading={isDestroying} onClick={() => onDestroying(uuid)}>Destroy</Button>
          </Space>
        );
      }
    }
  ];

  const onAccess = () => {
    let vendorAndKey = cloudVendor + '|' + accessKey;
    window.localStorage.setItem('cloud-vendor-and-access-key', vendorAndKey);
    setCloudVendorAndKey(vendorAndKey);
    setModalWidth(bigWidth);
    getTasks();
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

  const getTasks = async () => {
    setIsLoadingList(true);

    try {
      const res = await axios({
        method: 'get',
        url: `${apiHost}/api/tasks`,
        headers: { authorization: cloudVendorAndKey }
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
          chainspec_checksum: chain_spec_hash,
          bootnodes: boot_nodes,
          cloud_vendor: cloudVendor,
          access_key: accessKey,
          secret_key: accessSecret,
          region: 'ap-northeast-1',
          availability_zones: ['ap-northeast-1a'],
          instance_type: 't3.small',
          instance_count: 1,
          volume_type: 'gp2',
          volume_size: 80,
        }
      }).then(res => res.data);

      message.success('Deploy success!');
      console.log(res);

    } catch(err) {
      console.log(err);
    }

    setIsDeploying(false);
  }

  const onApply = async (uuid) => {
    setApplying({ ...applying, [uuid]: true });

    try {

      const res = await axios({
        method: 'post',
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
        method: 'post',
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
 
  return (
    <Modal visible={visible} title={false} onCancel={onCancel} 
      destroyOnClose={true} footer={null} width={modalWidth} style={{ transition: 'width .3s ease' }}>
     
      {
        cloudVendorAndKey ?
        <div>
          
          <div style={{ marginBottom: '20px' }}>
            
            {
              deployingNew ?
              <h3 style={{ fontSize: '20px' }}>Deploy New Validator</h3> :
              <h3 style={{ fontSize: '20px' }}>Cloud / { cloudVendorAndKey?.split('|')[0].toUpperCase() }</h3>
            }
            {
              !deployingNew &&
              <Row align="middle">
                <Col flex={1}>
                  <span style={{ fontSize: '14px', color: '#9c9c9c' }}>Access Key:</span>
                  <span style={{ fontSize: '14px', marginLeft: '10px' }}>{ cloudVendorAndKey?.split('|')[1] }</span>
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
                cloudVendor: cloudVendorAndKey ? cloudVendorAndKey.split('|')[0] : '',
                accessKey: cloudVendorAndKey ? cloudVendorAndKey.split('|')[1] : ''
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

