import React, { useState, useEffect, useRef } from 'react';

import {
  Row,
  Col,
  message,
  Card,
  Table,
  Pagination,
  notification,
  Statistic,
  Button
} from 'antd';

import {
  SelectOutlined,
  CopyOutlined
} from "@ant-design/icons";

import { ApiPromise, WsProvider } from '@polkadot/api';
import { utils, providers } from "near-api-js";
import { encodeAddress } from '@polkadot/util-crypto';
import { useLocation } from "react-router-dom";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { readableAppchain, fromDecimals, login } from "../../../utils";

import StakeModal from "./StakeModal";

const Validators = () => {
  const [appchain, setAppchain] = useState<any>();

  const location = useLocation();
  const [api, setApi] = useState<any>();
  const id = location.pathname.split('/')[2];

  const [isValidator, setIsValidator] = useState(false);
  const [validators, setValidators] = useState([]);
  const [validatorsPage, setValidatorsPage] = useState(1);
  const [validatorsPageSize, setValidatorsPageSize]= useState(10);
  const [appchainInitialized, setAppchainInitialized] = useState(false);

  const [stakeModalVisible, setStakeModalVisible] = useState(false);
  const [validatorCount, setValidatorCount] = useState();
  const [delegatorCount, setDelegatorCount] = useState();
  const [currentEra, setCurrentEra] = useState();
  
  const [isLoadingValidators, setIsLoadingValidators] = useState<boolean>(
    false
  );

  const subscriptions = useRef<any[]>([]);

  const gotoBlock = function (blockId) {
    utils.web
      .fetchJson(
        window.walletConnection._near?.config.nodeUrl,
        JSON.stringify({
          jsonrpc: "2.0",
          id: "dontcare",
          method: "block",
          params: {
            block_id: blockId,
          },
        })
      )
      .then(({ result }) => {
        window.location.href = `https://explorer.testnet.near.org/blocks/${result.header.hash}`;
      });
  };

  useEffect(() => {
    window.contract
      .get_appchain({ appchain_id: id })
      .then(appchain => {
        setAppchain(readableAppchain(appchain));
        if (appchain.status == 'Booting') {
          initAppchain(appchain);
        }
      });
   
  }, [id]);

  useEffect(() => {
    setIsLoadingValidators(true);
    window.contract
      .get_validators({
        appchain_id: id,
        start: (validatorsPage - 1 ) * validatorsPageSize,
        limit: validatorsPageSize
      }).then(validators => {
        setValidators(validators);
      }).finally(() => {
        setIsLoadingValidators(false);
      });
  }, [validatorsPage, validatorsPageSize, id]);

  const initAppchain = async (appchain) => {
    
    let types = {};
    try {
      types = await require(`../../../customTypes/${appchain.id}.json`);
    } catch(err) {
      types = await require(`../../../customTypes/defaultAppchain.json`);
    }
   
    let provider = new WsProvider(appchain.rpc_endpoint);
    const api = new ApiPromise({ provider, types: types || {} });

    api.on('connected', () => {
      console.log('connected');
    });

    api.on('ready', async () => {
      if (api.isReady) {
        setAppchainInitialized(true);
        setApi(api);
        // subscriptions
        
        subscriptions.current.push(
          await api.query.octopusLpos.counterForValidators((count: any) => {
            setValidatorCount(count.toNumber());
          })
        );
        subscriptions.current.push(
          await api.query.octopusLpos.counterForNominators((count: any) => {
            setDelegatorCount(count.toNumber());
          })
        );
        subscriptions.current.push(
          await api.query.octopusLpos.currentEra((era: any) => {
            setCurrentEra(era.value);
          })
        );
      }
    });

    api.once('error', err => {
      setAppchainInitialized(false);
      api.disconnect();
      notification.error({
        message: 'Error',
        description: err.message
      });

    });

    return () => {
      subscriptions.current.forEach(unsub => unsub());
    }
  }

  const validatorColumns = [
    {
      title: "Account",
      dataIndex: "account_id",
      render: (text) => {
        return (
          <a href={`https://explorer.testnet.near.org/accounts/${text}`}>
            <span style={{ position: "absolute", transform: "rotate(90deg)" }}>
              <SelectOutlined />
            </span>
            <span style={{ marginLeft: "20px" }}>{text}</span>
          </a>
        );
      },
    },
    {
      title: "Appchain Validator Account",
      dataIndex: "id",
      key: "id",
      render: (accountId) => {
        if (!/0x/i.test(accountId)) {
          accountId = '0x' + accountId;
        }
        const ss58Address = encodeAddress(
          accountId
        );

        return (
          <CopyToClipboard
            text={ss58Address}
            onCopy={() => message.info("Validator Id Copied!")}
          >
            <div style={{ cursor: "pointer" }}>
              <span>
                {ss58Address.substr(0, 10)}...{ss58Address.substr(-10)}
              </span>
              <span style={{ marginLeft: "5px", color: "#aaa" }}>
                <CopyOutlined />
              </span>
            </div>
          </CopyToClipboard>
        );
      },
    },
    {
      title: "Staked Amount",
      dataIndex: "staked_amount",
      render: (value) => {
        return <span>{fromDecimals(value)}</span>;
      },
    },
    {
      title: "Block Height",
      dataIndex: "block_height",
      render: (text) => {
        return <a onClick={() => gotoBlock(text)}>#{text}</a>;
      },
    },
  ];
  
  return (
    <>
    <Row gutter={[20, 20]}>
      <Col span={17}>
        <Card title="Overview">
          <Row gutter={20}>
            <Col span={8}>
              <Statistic title="Validators" value={validatorCount} loading={validatorCount === undefined} />
            </Col>
            <Col span={8}>
              <Statistic title="Delegators" value={delegatorCount} loading={delegatorCount === undefined} />
            </Col>
            <Col span={8}>
              <Statistic title="Current Era" value={currentEra} loading={currentEra === undefined} />
            </Col>
          </Row>
        </Card>
        <Card title="Validators" style={{ marginTop: '20px' }}>
          <Table
            columns={validatorColumns}
            rowKey={(record) => `${record.account_id}_${record.id}`}
            loading={isLoadingValidators}
            dataSource={validators}
            pagination={false}
          />
          {
            (validators.length && appchain?.validators_len > validatorsPageSize) ?
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <Pagination current={validatorsPage} pageSize={validatorsPageSize} 
              onChange={setValidatorsPage} showSizeChanger={false} total={appchain?.validators_len} /> 
            </div> : null
          }
        </Card>
      </Col>
      <Col span={7}>
        <Card title="Actions" bordered={false}>
          {
            isValidator ?
            <div style={{
              display: 'flex',
              alignItems: 'center'
            }}>
              <span>Validator Rewards: {0} BAR</span>
              <Button type="primary" style={{ marginLeft: '20px' }}>
                Get rewards
              </Button>
            </div> :
            window.accountId ?
            <Button onClick={() => setStakeModalVisible(true)}
              disabled={!(appchain?.status == 'Booting' || appchain?.status == 'Staging')}>
              Stake
            </Button> :
            <Button onClick={login} type="primary">
              Login to Stake
            </Button>
          }
          
        </Card>
      </Col>
    </Row>
    <StakeModal visible={stakeModalVisible} appchainId={appchain?.id} onCancel={() => setStakeModalVisible(false)} />
    </>
  );
}

export default Validators;