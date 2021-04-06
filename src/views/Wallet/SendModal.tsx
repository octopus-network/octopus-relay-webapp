import React, { useState, useCallback, useEffect } from 'react';

import { Account } from 'near-api-js'; 
import { Modal, Form, Input, Button, Alert, message } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import Big from 'big.js';

const BOATLOAD_OF_GAS = Big(3).times(10 ** 14).toFixed();

function SendModal({ visible, onCancel }) {

  const [accountChecking, setAccountChecking] = useState(false);
  const [accountChecked, setAccountChecked] = useState(false);

  const [amount, setAmount] = useState(0);
  const [sendTo, setSendTo] = useState('');

  const [accountErrorType, setAccountErrorType] = useState(0);
  const [isRegistering, setIsRegistering] = useState(false);

  const [isTransfering, setIsTransfering] = useState(false);

  const checkAccount = useCallback(() => {
    if (!sendTo) return;
    setAccountChecking(true);

    const account = new Account(window.walletConnection._near.connection, sendTo);
    account.state().then(state => {
      window.tokenContract?.storage_balance_of({
        account_id: sendTo
      }).then(data => {
        setAccountErrorType(0);
        setAccountChecking(false);
        setAccountChecked(false);
        if (data === null) {
          return setAccountErrorType(1);
        }
        setAccountChecked(true);
      }).catch(err => {
        setAccountChecking(false);
        message.error(err.toString());
      });
    }).catch(err => {
      setAccountChecking(false);
      setAccountChecked(false);
      setAccountErrorType(2);
    });

    
  }, [sendTo]);

  useEffect(() => {
    if (!visible) {
      setAccountChecked(false);
      setAccountChecking(false);
      setAccountErrorType(0);
      setIsTransfering(false);
      setIsRegistering(false);
    }
  }, [visible]);

  const onRegister = useCallback(() => {
    setIsRegistering(true);
    window.tokenContract?.storage_deposit(
      {
        account_id: sendTo
      },
      BOATLOAD_OF_GAS,
      Big(1).times(10 ** 22).toFixed(),
    ).then(() => {
      window.location.reload();
    }).catch((err) => {
      setIsRegistering(false);
      message.error(err.toString());
    });
  }, [sendTo, amount]);

  const onTransfer = useCallback(() => {
    setIsTransfering(true);
    window.tokenContract?.ft_transfer(
      {
        receiver_id: sendTo,
        amount: amount + '',
        memo: ''
      },
      BOATLOAD_OF_GAS,
      1,
    ).then(() => {
      window.location.reload();
    }).catch((err) => {
      setIsTransfering(false);
      message.error(err.toString());
    })
  }, [sendTo]);

  return (
    <Modal visible={visible} destroyOnClose={true} onCancel={onCancel} 
      footer={null} title='Send' width={480}>
      <Form layout='vertical'>
        <Form.Item label='Amount' rules={[
          { required: true, message: 'Please input the amount' }
        ]}>
          <Input placeholder='0' size='large' style={{ fontSize: '22px', fontWeight: 'bold' }} type='number' onChange={e => setAmount(e.target.value as any)} />
        </Form.Item>
        <Form.Item name='to' label='Send To' rules={[
          { required: true, message: 'Please input the send to account' }
        ]} extra={
          accountErrorType > 0 &&
          <div>
            {
              accountErrorType == 1 ?
              <div style={{ marginTop: '10px' }}>
                <span>This account haven't registered.</span>
                <Button type='ghost' loading={isRegistering} onClick={onRegister} size='small'>Register for him</Button>
              </div> :
              <Alert message='User not found' type="warning" showIcon 
                style={{ padding: '10px 0', border: 'none', background: '#fff' }} />
            }
          </div>
        }>
          <Input placeholder='eg. oct.testnet' size='large' onBlur={checkAccount} onChange={e => setSendTo(e.target.value as any)}
            suffix={accountChecking ? <LoadingOutlined /> : null} />
        </Form.Item>
        <Form.Item>
          <Button style={{ width: '100%' }} type='primary' onClick={onTransfer} loading={isTransfering}
            size='large' disabled={!amount || !sendTo || !accountChecked}>Submit</Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default React.memo(SendModal);