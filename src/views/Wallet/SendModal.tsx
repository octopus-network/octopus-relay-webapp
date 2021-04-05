import React, { useState, useCallback } from 'react';

import { Modal, Form, Input, Button } from 'antd';

function SendModal({ visible, onCancel }) {

  const [isSubmiting, setIsSubmiting] = useState(false);

  const onFinish = useCallback((values) => {
    const { amount, to } = values;
    if (!amount || isNaN(amount) || !to) return;

    setIsSubmiting(true);
    

  }, []);

  return (
    <Modal visible={visible} destroyOnClose={true} onCancel={onCancel} 
      footer={null} title='Send' width={400}>
      <Form layout='vertical' onFinish={onFinish}>
        <Form.Item name='amount' label='Amount'>
          <Input placeholder='0' size='large' type='number' />
        </Form.Item>
        <Form.Item name='to' label='Send To'>
          <Input placeholder='eg. oct.testnet' size='large' />
        </Form.Item>
        <Form.Item>
          <Button style={{ width: '100%' }} type='primary' htmlType='submit'
            loading={isSubmiting} size='large'>Submit</Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default React.memo(SendModal);