import React, { useCallback, useEffect, useState } from "react";

import { Button, Modal, Form, Input, message } from "antd";

import Big from 'big.js';
const BOATLOAD_OF_GAS = Big(3).times(10 ** 14).toFixed();

function SubqlModal({ visible, onCancel, appchainId, subqlUrl }): React.ReactElement {
  const [isSubmiting, setIsSubmiting] = useState<boolean>(false);

  const onFinish = useCallback((values) => {
    const { subql_url } = values;

    setIsSubmiting(true);
    window.contract.update_subql_url(
      {
        appchain_id: appchainId,
        subql_url
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
    <Modal visible={visible} title="Update Subql Url" 
      onCancel={onCancel} destroyOnClose={true} footer={null}>
      <Form onFinish={onFinish} labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} initialValues={{
        subql_url: subqlUrl
      }}>
       
        <Form.Item name="subql_url" label="Subql Url" rules={[
          { required: true, message: 'Please input the subql url' }
        ]}>
          <Input placeholder="please input subql url" size="large" />
        </Form.Item>
       
        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Button type="primary" htmlType="submit" loading={isSubmiting} size="large">Update</Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default React.memo(SubqlModal);