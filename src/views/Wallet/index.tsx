import React, { useEffect, useState, useCallback } from "react";

import { Card, Spin, Button, Result, message } from 'antd';
import { HomeOutlined, DollarCircleFilled } from '@ant-design/icons';

import Big from 'big.js';

import { Link } from 'react-router-dom';
import styles from './style.less';

import SendModal from './SendModal';

const BOATLOAD_OF_GAS = Big(3).times(10 ** 14).toFixed();

function Wallet(): React.ReactElement {
  const [accountBalance, setAccountBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [needRegister, setNeedRegister] = useState(false);

  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (!window.accountId) return;
    setIsLoading(true);
    window.tokenContract?.storage_balance_of({
      account_id: window.accountId
    }).then(data => {
      if (!data) {
        setNeedRegister(true);
        setIsLoading(false);
        return;
      }
      window.tokenContract?.ft_balance_of({
        account_id: window.accountId
      }).then(data => {
        setIsLoading(false);
        setAccountBalance(data);
      });
    });

  }, [window.accountId]);

  const onSend = useCallback(() => {
    setSendModalVisible(true);
  }, []);

  const toggleSendModalVisible = useCallback(() => {
    setSendModalVisible(!sendModalVisible);
  }, [sendModalVisible]);

  const onRegister = useCallback(() => {
    setIsRegistering(true);
    window.tokenContract?.storage_deposit(
      {
        account_id: window.accountId,
      },
      BOATLOAD_OF_GAS,
      Big(1).times(10 ** 22).toFixed(),
    ).then(() => {
      window.location.reload();
    }).catch((err) => {
      setIsRegistering(false);
      message.error(err.toString());
    })
  }, []);

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      <div className={styles.title}>
       
        <span>OCT Wallet</span>
      </div>
      {/* <div className={styles.breadcrumb}>
        <Link to='/'>
          <HomeOutlined /> <span>Home</span>
        </Link>
      </div> */}
      <Card bordered={false} className={styles.wrapper}>
        {
          window.accountId ?
          <>
            <Spin spinning={isLoading}>
              {
                needRegister ?
                <div>
                  <Result
                    title="Account not registered"
                    subTitle="Your account need to register on the OCT token contract, so that you can manage your OCT token"
                    extra={
                      <Button type="primary" key="console" onClick={onRegister} loading={isRegistering}>Register</Button>
                    }
                  />
                </div> :
                <>
                  <div className={styles.user}>{ window.accountId || 'Loading...' }</div>
                  <div className={styles.balance}>
                    <span className={styles.amount}>{ (accountBalance*1).toFixed(2) }</span>
                    <span className={styles.token}>OCT Balance</span>
                  </div>
                  <div className={styles.buttons}>
                    <Button type='primary' size='large' style={{ width: '200px' }} onClick={onSend}>Send</Button>
                    <Button type='ghost' size='large' style={{ marginLeft: '30px', width: '200px' }}>Receive</Button>
                  </div>
                </>
              }
            </Spin>
          </> :
          <Result
            status="warning"
            title="Please login first"
          />
        }
      </Card>
      <SendModal visible={sendModalVisible} onCancel={toggleSendModalVisible} />
    </div>
  );
}

export default React.memo(Wallet);