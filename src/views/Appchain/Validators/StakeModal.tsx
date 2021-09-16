import React, { useCallback, useState, useEffect } from "react";
import { decodeAddress } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';

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

import TokenBadge from "../../../components/TokenBadge";

import { toDecimals, fromDecimals } from "../../../utils";

function StakeModal({ visible, appchainId, onCancel }): React.ReactElement {
  const [appchain, setAppchain] = useState<any>();
  const [appchainLoading, setAppchainLoading] = useState<boolean>(false);
  const [isSubmiting, setIsSubmiting] = useState<boolean>();
  const [unstakeLoading, setUnstakeLoading] = useState<boolean>(false);
  const [accountExist, setAccountExist] = useState(false);

  const [accountBalance, setAccountBalance] = useState(0);
  const [stakingAmount, setStakingAmount] = useState(0);

  const [form] = Form.useForm();

  useEffect(() => {
    if (!appchainId) return;
    window.contract
      ?.account_exists({
        account_id: window.accountId,
        appchain_id: appchainId
      })
      .then(exist => {
        setAccountExist(exist);
      });

    window.tokenContract
      ?.ft_balance_of({
        account_id: window.accountId,
      })
      .then((data) => {
        setAccountBalance(data);
      });
  }, [visible, window.accountId, appchainId]);

  useEffect(() => {
    if (!visible) return;
    setAppchainLoading(true);
    Promise.all([
      window.contract.get_appchain({ appchain_id: appchainId }),
      window.contract.get_minimum_staking_amount(),
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
        // message.error(err.toString());
      });
  }, [visible, appchainId]);

  const onStake = function (values) {
    const { validatorAccount, stakingAmount } = values;

    let hexId = '';
    try {
      let u8a = decodeAddress(validatorAccount);
      hexId = u8aToHex(u8a);
    } catch(err) {
      message.error('Invalid account!');
      return;
    }

    setIsSubmiting(true);
    window.tokenContract
      .ft_transfer_call(
        {
          receiver_id: window.contractName,
          amount: toDecimals(stakingAmount),
          msg: `stake,${appchainId},${hexId}`,
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
        // message.error(err.toString());
      });
  };

  const onStakeMore = function (values) {
    const { stakingAmount } = values;
 
    setIsSubmiting(true);
    window.tokenContract
      .ft_transfer_call(
        {
          receiver_id: window.contractName,
          amount: toDecimals(stakingAmount),
          msg: `stake_more,${appchainId}`,
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
        // message.error(err.toString());
      });
  };

  const unstake = function (id) {
    setUnstakeLoading(true);
    window.contract
      .unstake(
        {
          appchain_id: id,
        },
        BOATLOAD_OF_GAS,
      )
      .then(() => {
        setUnstakeLoading(false);
        window.location.reload();
      })
      .catch((err) => {
        setUnstakeLoading(false);
        // message.error(err.toString());
      });
  };

  return (
    <Modal
      visible={visible}
      title="Stake"
      onCancel={onCancel}
      destroyOnClose={true}
      footer={null}
    >
      <Spin spinning={appchainLoading}>
        {accountExist ? (
          <div>
            <Form
              onFinish={onStakeMore}
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
                  Stake More
                </Button>
                <span style={{ margin: "0 10px", color: "#9c9c9c" }}> Or </span>
                <Popconfirm
                  onConfirm={() => unstake(appchain.id)}
                  title="Are you sure to unstake?"
                >
                  <Button type="ghost" loading={unstakeLoading} size="large">
                    Unstake
                  </Button>
                </Popconfirm>
              </Form.Item>
            </Form>
          </div>
        ) : (
          <Form
            onFinish={onStake}
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 16 }}
            form={form}
          >
            <Form.Item
              name="validatorAccount"
              label={
                <>
                  <span style={{ marginRight: "5px" }}>Validator Account</span>
                  <Tooltip title="Your validator account on the appchain, for example 5CaLqqE3...QUmJeZ">
                    <QuestionCircleOutlined
                      style={{ color: "rgb(250, 173, 20)" }}
                    />
                  </Tooltip>
                </>
              }
              rules={[
                { required: true, message: "Please input your validator account" },
              ]}
            >
              <Input
                placeholder="please input your validator account"
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
                placeholder="The amount you want to stake for"
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
                Stake
              </Button>
            </Form.Item>
          </Form>
        )}
      </Spin>
    </Modal>
  );
}

export default React.memo(StakeModal);
