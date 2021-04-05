import React, { useCallback, useEffect, useState } from "react";

import { Button, Modal, Form, Input } from "antd";

function UpdateModal({ visible, onCancel, onOk, appchainId }): React.ReactElement {
  const [isSubmiting, setIsSubmiting] = useState<boolean>(false);
  
  const onFinish = useCallback((values) => {
    setIsSubmiting(true);
    const { chainSpec, chainSpecHash } = values;
  
    onOk({ id: appchainId, chainSpec, chainSpecHash });
    // onOk(values);
  }, [appchainId]);

  useEffect(() => {
    setIsSubmiting(false);
  }, [visible]);

  return (
    <Modal visible={visible} title="Update Appchain" 
      onCancel={onCancel} destroyOnClose={true} footer={null}>
      <Form onFinish={onFinish} labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
        <Form.Item name="chainSpec" label="Chain Spec" rules={[
          { required: true, message: "Please input the chainspec url." }
        ]}>
          <Input placeholder="please input the chainspec url"/>
        </Form.Item>
        <Form.Item name="chainSpecHash" label="Hash"  rules={[
          { required: true, message: "Please input the chainspec hash" }
        ]}>
          <Input placeholder="please input the chainspec hash"/>
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Button type="primary" htmlType="submit" loading={isSubmiting}>Update</Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default React.memo(UpdateModal);