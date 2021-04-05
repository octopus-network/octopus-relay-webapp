import React, { useCallback, useState } from "react";

import { Button, Modal, Form, Input, Radio, Upload, message } from "antd";

import { UploadOutlined } from "@ant-design/icons";

import axios from "axios";

function UpdateModal({ visible, onCancel, onOk, appchainId }): React.ReactElement {
  const [isSubmiting, setIsSubmiting] = useState<boolean>(false);
  
  const onFinish = useCallback((values) => {
    setIsSubmiting(true);
    const { chainSpec, raw, chainSpecHash } = values;
  
    const formData = new FormData();
    formData.append('file', chainSpec.file);

    axios.post(`/.netlify/functions/upload?appchain=${appchainId}&raw=${raw}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
      .then(res => {
        const { success, data, message } = res.data;
        if (success == true) {
          onOk({ chainSpec: data.link, chainSpecHash });
        } else {
          throw new Error(message || 'Unknown error.')
        }
      })
      .catch(err => {
        setIsSubmiting(false);
        message.error('Upload error: ' + err.toString());
      });
     
    // onOk(values);
  }, []);

  const uploadProps = {
    maxCount: 1,
    beforeUpload: (files) => {
      return false;
    }
  }

  return (
    <Modal visible={visible} title="Update Appchain" 
      onCancel={onCancel} destroyOnClose={true} footer={null}>
      <Form onFinish={onFinish} labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} 
        initialValues={{ bondTokenAmount: 100, raw: 1 }}>
        <Form.Item name="chainSpec" label="Chain Spec" rules={[
          { required: true, message: "Please choose chainspec file." }
        ]}>
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />}>Click to Upload</Button>
          </Upload>
        </Form.Item>
        <Form.Item name="raw" label="Type">
          <Radio.Group>
            <Radio value={1}>Raw</Radio>
            <Radio value={0}>Not Raw</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item name="chainSpecHash" label="Hash"  rules={[
          { required: true, message: "Please nput the chainspec hash" }
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