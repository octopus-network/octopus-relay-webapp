import React, { useState, useEffect, useCallback } from "react";

import {
  Input,
  Popconfirm,
  Button,
  Card,
  Form,
  Alert,
  Row,
  Col,
  Spin,
  message,
  Tooltip,
} from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import {
  LeftOutlined,
  InfoCircleFilled,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { Link, useParams, useNavigate } from "react-router-dom";

import Big from "big.js";

const BOATLOAD_OF_GAS = Big(3)
  .times(10 ** 14)
  .toFixed();

import styles from "./styles.less";

function Update(): React.ReactElement {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmiting, setIsSubmiting] = useState(false);

  const [appchain, setAppchain] = useState<any>();

  const onFinish = useCallback((values) => {
    const {
      github_release,
      commit_id,
      website_url,
      github_address,
    } = values;
    setIsSubmiting(true);
    window.contract
      .update_appchain(
        {
          appchain_id: id,
          website_url: website_url || "",
          github_address: github_address || "",
          github_release,
          commit_id,
          chain_spec_url: '',
          chain_spec_hash: '',
        },
        BOATLOAD_OF_GAS,
        0
      )
      .then(() => {
        window.location.reload();
      })
      .catch((err) => {
        setIsSubmiting(false);
        message.error(err.toString());
      });
  }, []);

  useEffect(() => {
    setIsLoading(true);
    window.contract
      .get_appchain({ appchain_id: id })
      .then((appchain) => {
        setAppchain(appchain);
        form.setFieldsValue({
          website_url: appchain.website_url,
          github_address: appchain.github_address,
          github_release: appchain.github_release,
          commit_id: appchain.commit_id,
        });
      })
      .finally(() => setIsLoading(false));
  }, []);

  const navigate = useNavigate();

  const [form] = Form.useForm();

  return (
    <div className="container" style={{ padding: "20px 0" }}>
      <div className={styles.breadcrumb} onClick={() => navigate(-1)}>
        <LeftOutlined /> <span>Back</span>
      </div>

      <Card bordered={false} style={{ marginTop: "20px" }} loading={isLoading}>
        <Form
          labelCol={{ span: 4 }}
          wrapperCol={{ span: 20 }}
          className={styles.form}
          colon={false}
          onFinish={onFinish}
          form={form}
        >
          <Form.Item
            label="Appchain name"
          >
            <span style={{ fontSize: "18px", color: "#9c9c9c" }}>
              {appchain?.id}
            </span>
          </Form.Item>
          <Form.Item label="Website" name="website_url">
            <Input placeholder="Your website url" size="large" />
          </Form.Item>
          <Form.Item label='Github' name='github_address' rules={[
            { required: true, message: 'please input your github address' }
          ]}>
            <Input placeholder='github address' size='large' />
          </Form.Item>
          <Form.Item label='Github release' name='github_release' rules={[
            { required: true, message: 'please input your github release' }
          ]}>
            <Input placeholder='github release' size='large' />
          </Form.Item>
          <Form.Item label='Commit id' name='commit_id' rules={[
            { required: true, message: 'please input the commit id' }
          ]}>
            <Input placeholder='commit id' size='large' />
          </Form.Item>
          <Form.Item wrapperCol={{ span: 24 }}>
            <Row justify="space-between" align="middle">
              <span />
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                loading={isSubmiting}
              >
                Update
              </Button>
            </Row>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default React.memo(Update);
