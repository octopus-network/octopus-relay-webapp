import React, { useCallback, useEffect, useState } from "react";

import { Button, Modal, Form, Input, Alert } from "antd";

import TokenBadge from "../../components/TokenBadge";

function RegisterModal({ visible, onCancel, onOk }): React.ReactElement {
  const [isSubmiting, setIsSubmiting] = useState<boolean>(false);

  const miniumBondTokenAmount = 100;
  const [accountBalance, setAccountBalance] = useState(0);
  const [bondTokenAmount, setBondTokenAmount] = useState(miniumBondTokenAmount);

  useEffect(() => {
    window.tokenContract?.ft_balance_of({
      account_id: window.accountId
    }).then(data => {
      setAccountBalance(data);
    });
    setBondTokenAmount(miniumBondTokenAmount);
  }, [visible]);

  const onFinish = useCallback((values) => {
    setIsSubmiting(true);
    onOk(values);
  }, []);

  return (
    <Modal visible={visible} title="Register Appchain" 
      onCancel={onCancel} destroyOnClose={true} footer={null}>
      <Form onFinish={onFinish} labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} 
        initialValues={{ bondTokenAmount: miniumBondTokenAmount }}>
        <Form.Item name="appchainName" label="Appchain Name">
          <Input placeholder="please input the appchain name." size="large" />
        </Form.Item>
        <Form.Item name="bondTokenAmount" label="Bond Token" extra={
          accountBalance < bondTokenAmount &&
          <Alert message="insufficient balance" type="warning" showIcon 
            style={{ padding: '10px 0', border: 'none', background: '#fff' }} />
        }>
          <Input placeholder="The amount you want to stake for your chain" onChange={e => setBondTokenAmount(e.target.value as any)}
            type="number" addonAfter={<TokenBadge />} size="large" />
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Button type="primary" htmlType="submit" loading={isSubmiting} size="large">Register</Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default React.memo(RegisterModal);