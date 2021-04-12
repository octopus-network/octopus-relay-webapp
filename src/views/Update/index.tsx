import React, { useState, useEffect, useCallback } from 'react';

import { Input, Popconfirm, Button, Card, Form, Alert, Row, Col, Spin, message } from 'antd';

import { LeftOutlined, PlusCircleFilled, InfoCircleFilled, QuestionCircleOutlined } from '@ant-design/icons';
import { Link, useParams, useNavigate } from 'react-router-dom';

import Big from 'big.js';

const BOATLOAD_OF_GAS = Big(3).times(10 ** 14).toFixed();

import styles from './styles.less';

function Update(): React.ReactElement {

  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmiting, setIsSubmiting] = useState(false);

  const [appchain, setAppchain] = useState<any>();

  const onFinish = useCallback((values) => { 
    const { chain_spec_url, chain_spec_hash, website_url, github_address } = values;
    setIsSubmiting(true);
    window.contract.update_appchain(
      {
        appchain_id: id * 1,
        website_url: website_url || '',
        github_address: github_address || '',
        chain_spec_url,
        chain_spec_hash,
      },
      BOATLOAD_OF_GAS,
      0
    ).then(() => {
      window.location.reload();
    }).catch(err => {
      setIsSubmiting(false);
      message.error(err.toString());
    });
  }, []);

  useEffect(() => {
    setIsLoading(true);
    window.contract.get_appchain({ appchain_id: id*1 }).then(appchain => {
      
      setAppchain(appchain);
      form.setFieldsValue({
        appchain_name: appchain.appchain_name,
        website_url: appchain.website_url,
        github_address: appchain.github_address,
        chain_spec_url: appchain.chain_spec_url,
        chain_spec_hash: appchain.chain_spec_hash
      });
      
    }).finally(() => setIsLoading(false));
    
  }, []);

  const navigate = useNavigate();

  const [form] = Form.useForm();

  return (
    <div>
    
      <div className={styles.breadcrumb} onClick={() => navigate(-1) }>
        <LeftOutlined /> <span>Back</span>
      </div>
     
      <Card bordered={false} style={{ marginTop: '20px' }} loading={isLoading}>
      
        <Form labelCol={{ span: 4 }} wrapperCol={{ span: 20 }} className={styles.form} colon={false} onFinish={onFinish} form={form}>
          <Form.Item label='Appchain name' name='appchain_name' rules={[
            { required: true, message: 'please input your appchain name' }
          ]}>
            <span style={{ fontSize: '18px', color: '#9c9c9c' }}>{appchain?.appchain_name}</span>
          </Form.Item>
          <Form.Item label='Website' name='website_url'>
            <Input placeholder='Your website url' size='large' />
          </Form.Item>
          <Form.Item label='Github' name='github_address'>
            <Input placeholder='Your github address' size='large' />
          </Form.Item>
          <Form.Item label='Chain Spec' name='chain_spec_url' rules={[
            { required: true, message: 'please input your chain spec url' }
          ]}>
            <Input placeholder='Your chain spec url' size='large' />
          </Form.Item>
          <Form.Item label='Chain Spec Hash' name='chain_spec_hash' rules={[
            { required: true, message: 'please input your chain spec hash' }
          ]}>
            <Input placeholder='Your chain spec hash' size='large' />
          </Form.Item>
          <Form.Item wrapperCol={{ span: 24 }}>
            <Row justify='space-between' align='middle'>
              <span style={{ color: '#faad14' }}><InfoCircleFilled /> When you update the appchain, its status will change to frozen</span>
              <Button type='primary' size='large' htmlType='submit' loading={isSubmiting}>Update</Button>
            </Row>
          </Form.Item>
        </Form>
      </Card>
    
    </div>
  );
}

export default React.memo(Update);