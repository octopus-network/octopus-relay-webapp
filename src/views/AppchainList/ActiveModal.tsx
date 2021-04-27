import React, { useCallback, useEffect, useState } from "react";

import { Button, Modal, Form, Input, message } from "antd";

import Big from 'big.js';
const BOATLOAD_OF_GAS = Big(3).times(10 ** 14).toFixed();

function ActiveModal({ visible, onCancel, appchainId }): React.ReactElement {
  const [isSubmiting, setIsSubmiting] = useState<boolean>(false);

  const onFinish = useCallback((values) => {
    const { boot_nodes, rpc_endpoint } = values;
    setIsSubmiting(true);

    window.contract.activate_appchain(
      {
        appchain_id: appchainId * 1,
        boot_nodes,
        rpc_endpoint,
      },
      BOATLOAD_OF_GAS,
      0
    ).then(() => {
      window.location.reload();
    }).catch(err => {
      setIsSubmiting(false);
      message.error(err.toString());
    });
  }, [appchainId]);
  
  return (
    <Modal visible={visible} title="Active Appchain" 
      onCancel={onCancel} destroyOnClose={true} footer={null}>
      <Form onFinish={onFinish} labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
        <Form.Item name="boot_nodes" label="Boot Nodes" rules={[
          { required: true, message: 'Please input the boot nodes' }
        ]}>
          <Input placeholder="please input the boot nodes" size="large" />
        </Form.Item>
        <Form.Item name="rpc_endpoint" label="RPC Endpoint" rules={[
          { required: true, message: 'Please input the rpc endpoint' }
        ]}>
          <Input placeholder="please input rpc endpoint" size="large" />
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Button type="primary" htmlType="submit" loading={isSubmiting} size="large">Active</Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default React.memo(ActiveModal);