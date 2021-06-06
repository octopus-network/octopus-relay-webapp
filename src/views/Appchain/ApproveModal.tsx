import React, { useCallback, useEffect, useState } from "react";

import { Button, Modal, Form, Input, message } from "antd";

import Big from 'big.js';
const BOATLOAD_OF_GAS = Big(3).times(10 ** 14).toFixed();

function ApproveModal({ visible, onCancel, appchainId }): React.ReactElement {
  const [isSubmiting, setIsSubmiting] = useState<boolean>(false);

  const onFinish = useCallback((values) => {
    const { chain_spec_url, chain_spec_hash, chain_spec_raw_url, chain_spec_raw_hash } = values;
    setIsSubmiting(true);

    window.contract.list_appchain(
      {
        appchain_id: appchainId,
        chain_spec_url,
        chain_spec_hash,
        chain_spec_raw_url,
        chain_spec_raw_hash
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
    <Modal visible={visible} title="Approve Appchain" 
      onCancel={onCancel} destroyOnClose={true} footer={null}>
      <Form onFinish={onFinish} labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} colon={false}>
        <Form.Item name="chain_spec_url" label="Chain spec" rules={[
          { required: true, message: 'Please input the chain spec url' }
        ]}>
          <Input placeholder="please input the chain spec url" size="large" />
          
        </Form.Item>
        <Form.Item name="chain_spec_hash" label=" " rules={[
          { required: true, message: 'Please input the chain spec hash' }
        ]}>
          <Input placeholder="chain spec hash" size="large" />
        </Form.Item>
        <Form.Item name="chain_spec_raw_url" label="Raw chain spec" rules={[
          { required: true, message: 'Please input the raw chain spec url' }
        ]}>
          <Input placeholder="please input the chain spec url" size="large" />
        </Form.Item>
        <Form.Item name="chain_spec_raw_hash" label=" " rules={[
          { required: true, message: 'Please input the raw chain spec hash' }
        ]}>
          <Input placeholder="raw chain spec hash" size="large" />
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Button type="primary" htmlType="submit" loading={isSubmiting} size="large">Approve</Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default React.memo(ApproveModal);