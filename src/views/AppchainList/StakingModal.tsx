import React, { useCallback, useState, useEffect } from "react";

import {
  Button,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Spin,
  Alert,
  Tooltip,
} from "antd";
import Big from "big.js";

import { QuestionCircleOutlined } from "@ant-design/icons";

const BOATLOAD_OF_GAS = Big(3)
  .times(10 ** 14)
  .toFixed();

import TokenBadge from "../../components/TokenBadge";

import { toDecimals, fromDecimals } from "../../utils";

function StakingModal({ visible, appchainId, onCancel }): React.ReactElement {
  const [appchain, setAppchain] = useState<any>();
  const [appchainLoading, setAppchainLoading] = useState<boolean>(false);
  const [isSubmiting, setIsSubmiting] = useState<boolean>();
  const [unstakingLoading, setUnstakingLoading] = useState<boolean>(false);

  const [accountBalance, setAccountBalance] = useState(0);
  const [stakingAmount, setStakingAmount] = useState(0);

  const [form] = Form.useForm();

  useEffect(() => {
    window.tokenContract
      ?.ft_balance_of({
        account_id: window.accountId,
      })
      .then((data) => {
        setAccountBalance(data);
      });
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    setAppchainLoading(true);
    Promise.all([
      window.contract.get_appchain({ appchain_id: appchainId }),
      window.contract.get_minium_staking_amount(),
    ])
      .then(([appchain, oAmount]) => {
        const amount = fromDecimals(oAmount);
        setAppchain(appchain);
        setAppchainLoading(false);
        console.log(appchain);
        form.setFieldsValue({ stakingAmount: amount });
        setStakingAmount(amount);
      })
      .catch((err) => {
        setAppchainLoading(false);
        message.error(err.toString());
      });
  }, [visible, appchainId]);

  const onStaking = function (values) {
    const { validatorId, stakingAmount } = values;
    setIsSubmiting(true);
    window.tokenContract
      .ft_transfer_call(
        {
          receiver_id: window.contractName,
          amount: toDecimals(stakingAmount),
          msg: `staking,${appchainId},${validatorId}`,
        },
        BOATLOAD_OF_GAS,
        1
      )
      .then(() => {
        setIsSubmiting(false);
        window.location.reload();
      })
      .catch((err) => {
        setIsSubmiting(false);
        message.error(err.toString());
      });
  };

  const onStakingMore = function (values) {
    const { appchainId, stakingAmount } = values;
    setIsSubmiting(true);
    window.tokenContract
      .ft_transfer_call(
        {
          receiver_id: window.contractName,
          amount: toDecimals(stakingAmount),
          msg: `staking_more,${appchainId}`,
        },
        BOATLOAD_OF_GAS,
        1
      )
      .then(() => {
        setIsSubmiting(false);
        window.location.reload();
      })
      .catch((err) => {
        setIsSubmiting(false);
        message.error(err.toString());
      });
  };

  const unstaking = function (id) {
    setUnstakingLoading(true);
    window.contract
      .unstaking(
        {
          appchain_id: id,
        },
        BOATLOAD_OF_GAS,
        1
      )
      .then(() => {
        setUnstakingLoading(false);
        window.location.reload();
      })
      .catch((err) => {
        setUnstakingLoading(false);
        message.error(err.toString());
      });
  };

  return (
    <Modal
      visible={visible}
      title="Staking"
      onCancel={onCancel}
      destroyOnClose={true}
      footer={null}
    >
      <Spin spinning={appchainLoading}>
        {appchain?.validators.some((v) => v.account_id == window.accountId) ? (
          <div>
            <Form
              onFinish={onStakingMore}
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 16 }}
              form={form}
            >
              <Form.Item
                name="stakingAmount"
                label="Staking Amount"
                rules={[
                  {
                    required: true,
                    message: "Please input the staking amount",
                  },
                ]}
                extra={
                  accountBalance * 1 < stakingAmount * 1 && (
                    <Alert
                      message="insufficient balance"
                      type="warning"
                      showIcon
                      style={{
                        padding: "10px 0",
                        border: "none",
                        background: "#fff",
                      }}
                    />
                  )
                }
              >
                <Input
                  size="large"
                  placeholder="The amount you want to staking for"
                  type="number"
                  addonAfter={<TokenBadge />}
                  onChange={(e) => setStakingAmount(e.target.value as any)}
                />
              </Form.Item>
              <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isSubmiting}
                  size="large"
                >
                  Staking More
                </Button>
                <span style={{ margin: "0 10px", color: "#9c9c9c" }}> Or </span>
                <Popconfirm
                  onConfirm={() => unstaking(appchain.id)}
                  title="Are you sure to unstaking?"
                >
                  <Button type="ghost" loading={unstakingLoading} size="large">
                    Unstaking
                  </Button>
                </Popconfirm>
              </Form.Item>
            </Form>
          </div>
        ) : (
          <Form
            onFinish={onStaking}
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 16 }}
            form={form}
          >
            <Form.Item
              name="validatorId"
              label={
                <>
                  <span style={{ marginRight: "5px" }}>Validator ID</span>
                  <Tooltip title="Your validator id on the appchain, for example 0x44ccd...7e151b">
                    <QuestionCircleOutlined
                      style={{ color: "rgb(250, 173, 20)" }}
                    />
                  </Tooltip>
                </>
              }
              rules={[
                { required: true, message: "Please input your validator id" },
              ]}
            >
              <Input
                placeholder="please input your validator id"
                size="large"
              />
            </Form.Item>
            <Form.Item
              name="stakingAmount"
              label="Staking Amount"
              extra={
                accountBalance * 1 < stakingAmount * 1 && (
                  <Alert
                    message="insufficient balance"
                    type="warning"
                    showIcon
                    style={{
                      padding: "10px 0",
                      border: "none",
                      background: "#fff",
                    }}
                  />
                )
              }
              rules={[
                { required: true, message: "Please input the staking amount" },
              ]}
            >
              <Input
                placeholder="The amount you want to staking for"
                type="number"
                addonAfter={<TokenBadge />}
                onChange={(e) => setStakingAmount(e.target.value as any)}
                size="large"
              />
            </Form.Item>
            <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmiting}
                size="large"
              >
                Staking
              </Button>
            </Form.Item>
          </Form>
        )}
      </Spin>
    </Modal>
  );
}

export default React.memo(StakingModal);
