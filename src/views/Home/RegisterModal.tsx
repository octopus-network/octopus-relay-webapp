import React, { useCallback, useEffect, useState } from "react";

import { Button, Modal, Form, Input, Spin, Result } from "antd";

import TokenBadge from "../../components/TokenBadge";

function RegisterModal({ visible, onCancel, onOk }): React.ReactElement {
  const [isSubmiting, setIsSubmiting] = useState<boolean>(false);

  const onFinish = useCallback((values) => {
    setIsSubmiting(true);
    onOk(values);
  }, []);


  return (
    <Modal visible={visible} title="Register Appchain" 
      onCancel={onCancel} destroyOnClose={true} footer={null}>
      <Form onFinish={onFinish} labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} 
        initialValues={{ bondTokenAmount: 100 }}>
        <Form.Item name="appchainName" label="Appchain Name">
          <Input placeholder="please input the appchain name."/>
        </Form.Item>
        <Form.Item name="bondTokenAmount" label="Bond Token">
          <Input placeholder="The amount you want to stake for your chain" type="number" addonAfter={<TokenBadge />} />
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Button type="primary" htmlType="submit" loading={isSubmiting}>Register</Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default React.memo(RegisterModal);