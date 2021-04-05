import React, { useEffect, useState, useCallback } from "react";

import { Card, Spin, Button } from 'antd';

import styles from './style.less';

import SendModal from './SendModal';

function Wallet(): React.ReactElement {
  const [accountBalance, setAccountBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [sendModalVisible, setSendModalVisible] = useState(false);

  useEffect(() => {
    if (!window.accountId) return;
    setIsLoading(true);
    window.tokenContract?.ft_balance_of({
      account_id: window.accountId
    }).then(data => {
      setIsLoading(false);
      setAccountBalance(data);
    });

  }, [window.accountId]);

  const onSend = useCallback(() => {
    setSendModalVisible(true);
  }, []);

  const toggleSendModalVisible = useCallback(() => {
    setSendModalVisible(!sendModalVisible);
  }, [sendModalVisible]);

  return (
    <div>
      <Card bordered={false} className={styles.wrapper}>
        <Spin spinning={isLoading}>
          <div className={styles.user}>{ window.accountId || 'Loading...' }</div>
          <div className={styles.balance}>
            <span className={styles.amount}>{ (accountBalance*1).toFixed(2) }</span>
            <span className={styles.token}>OCT Balance</span>
          </div>
          <div className={styles.buttons}>
            <Button type='primary' size='large' style={{ width: '200px' }} onClick={onSend}>Send</Button>
            <Button type='ghost' size='large' style={{ marginLeft: '30px', width: '200px' }}>Receive</Button>
          </div>
        </Spin>
      </Card>
      <SendModal visible={sendModalVisible} onCancel={toggleSendModalVisible} />
    </div>
  );
}

export default React.memo(Wallet);