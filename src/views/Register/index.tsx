import React, { useState, useEffect, useCallback } from 'react';

import { Input, Tooltip, Button, Card, Form, Alert, Row, Col, Spin, message } from 'antd';

import { LeftOutlined, PlusCircleFilled, InfoCircleFilled, QuestionCircleOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

import Big from 'big.js';

const BOATLOAD_OF_GAS = Big(3).times(10 ** 14).toFixed();

import styles from './styles.less';
import {toDecimals, fromDecimals} from '../../utils';

function Register(): React.ReactElement {
  const urlParams = new URLSearchParams(window.location.search);
  const transactionHashes = urlParams.get('transactionHashes');
  if (transactionHashes) {
    window.location.replace('/');
  }

  const miniumBondTokenAmount = 100;
  const [accountBalance, setAccountBalance] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const [isSubmiting, setIsSubmiting] = useState(false);

  const onFinish = useCallback((values) => {
    if (accountBalance < miniumBondTokenAmount) {
      return message.error('Insufficient balance');
    }
    const { appchain_name, github_address, website_url } = values;
    setIsSubmiting(true);
    
    window.tokenContract.ft_transfer_call(
      {
        receiver_id: window.contractName,
        amount: toDecimals(miniumBondTokenAmount),
        msg: `register_appchain,${appchain_name},${website_url || ''},${github_address || ''}`
      },
      BOATLOAD_OF_GAS,
      1,
    ).then(() => {
      window.location.reload();
    }).catch((err) => {
      setIsSubmiting(false);
      message.error(err.toString());
    });

  }, [accountBalance, miniumBondTokenAmount]);

  useEffect(() => {
    setIsLoadingBalance(true);
    window.tokenContract?.ft_balance_of({
      account_id: window.accountId
    }).then(data => {
      setAccountBalance(fromDecimals(data));
    }).finally(() => setIsLoadingBalance(false));

  }, []);

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      <div className={styles.title}>
      
        <span>Register Appchain</span>
      </div>
      {/* <Link to='/'>
        <div className={styles.breadcrumb}>
          <LeftOutlined /> <span>Back to home</span>
        </div>
      </Link>
      */}
      <Card bordered={false} style={{ marginTop: '20px' }}>
        <div className={styles.alert}>
          <InfoCircleFilled />
          <span>Please fill the information below, with </span>
          <span style={{ color: '#f00' }}>* </span> 
          <span>is required.</span>
        </div>
        <Form labelCol={{ span: 4 }} wrapperCol={{ span: 20 }} className={styles.form} colon={false} onFinish={onFinish}>
          <Form.Item label='Appchain name' name='appchain_name' rules={[
            { required: true, message: 'please input your appchain name' }
          ]}>
            <Input placeholder='Your appchain name' size='large' />
          </Form.Item>
          <Form.Item label='Website' name='website_url'>
            <Input placeholder='Your website url' size='large' />
          </Form.Item>
          <Form.Item label='Github' name='github_address'>
            <Input placeholder='Your github address' size='large' />
          </Form.Item>
          <Form.Item label={
            <div>
              <span>Bond token</span>
              <span style={{ marginLeft: '5px', cursor: 'pointer' }}>
                <Tooltip title='Bonded tokens will return to your account when your appchain has been successfully activated'>
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            </div>
          }>
            <Row justify='space-between' align='middle'>
              <div>
                <p>
                  <span className={styles.amount} style={{ fontSize: '20px' }}>
                    {miniumBondTokenAmount} OCT
                  </span>
                </p>
                <p style={{ fontSize: '12px', color: '#9c9c9c' }}>
                  <Spin spinning={isLoadingBalance}>
                   <span>Balance: {accountBalance} OCT</span>
                  </Spin>
                </p>
              </div>
              <div>
                <Button type='primary' size='large' htmlType='submit' loading={isSubmiting}>Register</Button>
              </div>
            </Row>
          </Form.Item>
        </Form>
      </Card>
    
    </div>
  );
}

export default React.memo(Register);