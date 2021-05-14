import React, { useState, useEffect, useCallback } from "react";

import { ApiPromise, WsProvider } from '@polkadot/api';
import { formatBalance } from '@polkadot/util';

import { utils } from "near-api-js";
import { useParams } from "react-router-dom";
import {
  Card,
  Descriptions,
  message,
  Table,
  Button,
  Breadcrumb,
  Tabs,
  ConfigProvider,
  Empty,
  Popover,
  notification
} from "antd";

import {
  LeftOutlined,
  DribbbleOutlined,
  RightOutlined,
  SelectOutlined,
  CopyOutlined,
  GithubOutlined,
  EditOutlined,
  CodeOutlined,
  UserOutlined,
  UpOutlined,
  DownOutlined,
  LinkOutlined,
  LoadingOutlined
} from "@ant-design/icons";

import { Link } from "react-router-dom";

import { CopyToClipboard } from "react-copy-to-clipboard";
import classnames from "classnames";

import customTypes from '../../customTypes';

import styles from "./styles.less";
import { readableAppchain } from "../../utils";

import BlockTable from './BlockTable';
import RPCModal from './RPCModal';

function Appchain(): React.ReactElement {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [appchain, setAppchain] = useState<any>();

  const [isLoadingValidators, setIsLoadingValidators] = useState<boolean>(
    false
  );
  const [currValidatorSetIdx, setCurrValidatorSetIdx] = useState<number>(0);
  const [appchainValidatorIdex, setAppchainValidatorIdx] = useState<number>(0);
  const [validatorSet, setValidatorSet] = useState<any>();

  const [rpcModalVisible, setRPCModalVisible] = useState(false);

  const [api, setApi] = useState<any>();

  const columns = [
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
      title: "Appchain Validator Id",
      dataIndex: "id",
      key: "id",
      render: (text) => {
        return (
          <CopyToClipboard
            text={text}
            onCopy={() => message.info("Validator Id Copied!")}
          >
            <div style={{ cursor: "pointer" }}>
              <span>
                {text.substr(0, 10)}...{text.substr(-10)}
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
      title: "Weight",
      dataIndex: "weight",
      render: (value) => {
        return <span>{value}</span>;
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

  useEffect(() => {
    setIsLoading(true);
    let appchainId = 0;
    if (!isNaN(id as any)) {
      appchainId = +id;
    }
    Promise.all([
      window.contract.get_appchain({ appchain_id: appchainId }),
      window.contract.get_curr_validator_set_index({ appchain_id: appchainId }),
    ]).then(([appchain, idx]) => {
      setIsLoading(false);
      setAppchain(readableAppchain(appchain));
      setCurrValidatorSetIdx(idx);
      setAppchainValidatorIdx(idx);
      if (appchain.status == 'Active') {
        initAppchain(appchain.rpc_endpoint);
      }
      // initAppchain('wss://barnacle-dev.rpc.testnet.oct.network:9944');
      // getValidators(appchainId, idx);
    });
  }, [id]);

  const getValidators = function (idx) {
    setIsLoadingValidators(true);
    window.contract
      .get_validator_set({ appchain_id: appchain.id, seq_num: idx })
      .then((set) => {
        setIsLoadingValidators(false);
        setValidatorSet(set);
      })
      .catch((err) => {
        setIsLoadingValidators(false);
        message.error(err.toString());
      });
  };

  useEffect(() => {
    if (currValidatorSetIdx == 0) {
      return setValidatorSet([]);
    }
    getValidators(currValidatorSetIdx);
  }, [currValidatorSetIdx]);

  const onPrevIndex = useCallback(() => {
    if (currValidatorSetIdx > 0) {
      setCurrValidatorSetIdx(currValidatorSetIdx - 1);
    }
  }, [currValidatorSetIdx]);

  const onNextIndex = useCallback(() => {
    if (!appchain) return;
    if (currValidatorSetIdx < appchainValidatorIdex) {
      setCurrValidatorSetIdx(currValidatorSetIdx + 1);
    }
  }, [currValidatorSetIdx, appchain]);

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

  const [appchainInitializing, setAppchainInitializing] = useState(false);
  const [appchainInitialized, setAppchainInitialized] = useState(false);

  const [finalizedBlock, setFinalizedBlock] = useState(0);
  const [bestBlock, setBestBlock] = useState(0);
  const [totalIssuance, setTotalIssuance] = useState('0');

  const initAppchain = useCallback((socket) => {
    console.log(customTypes[id]);
    setAppchainInitializing(true);
    let provider = new WsProvider(socket);
    const api = new ApiPromise({ provider, types: customTypes[id] || {} });

    api.on('connected', () => {
      console.log('connected');
    });

    let unsubNewHeads = () => {};
    let unsubNewFinalizedHeads = () => {};

    api.on('ready', async () => {
      setAppchainInitializing(false);
      if (api.isReady) {
        setAppchainInitialized(true);
        setApi(api);

        // subscriptions
        unsubNewHeads = await api.rpc.chain.subscribeNewHeads((lastHeader) => {
          setBestBlock(lastHeader.number.toNumber());
        });

        unsubNewFinalizedHeads = await api.rpc.chain.subscribeFinalizedHeads((finalizedHeader) => {
          setFinalizedBlock(finalizedHeader.number.toNumber());
        });

        const totalIssuance = await api.query.balances?.totalIssuance();
        setTotalIssuance(
          formatBalance(
            totalIssuance, { 
              decimals: api.registry?.chainDecimals[0],
              withUnit: false 
            }
          ) + api.registry?.chainTokens[0]
        );
        
      }
    });

    api.once('error', err => {
      setAppchainInitializing(false);
      setAppchainInitialized(false);
      api.disconnect();
      notification.error({
        message: 'Error',
        description: err.message
      });

    });

    return () => {
      unsubNewHeads();
      unsubNewFinalizedHeads();
     
    }
   
  }, []);

  const onRPCCallOk = useCallback((res) => {
    console.log(res);
    setRPCModalVisible(false);
    message.success('RPC Call Success!');
  }, []);

  return (
    <div className='container' style={{ padding: '20px 0' }}>
      <div className={styles.title}>
        <div className={styles.left}>
          <div className={styles.breadcrumb}>
            <Link to='/appchain'>Appchains</Link>
            <span className={styles.arrow}>
              <RightOutlined />
            </span>
            <span className={classnames(styles.name, styles.skeleton)}>
              {appchain?.appchain_name}
            </span>
          </div>
          <div className={styles.appchainName}>
            <span className={classnames(styles.text, styles.skeleton)}>
              {appchain?.appchain_name}
            </span>
            <span
              className={classnames(styles.status, styles[appchain?.status])}
            >
              {appchain?.status}
            </span>
            {/* <div className={styles.vote}>
              <span className={classnames(styles.btn, styles.up)}><UpOutlined /></span>
              <span className={styles.num}>0</span>
              <span className={classnames(styles.btn, styles.down)}><DownOutlined /></span>
            </div> */}
          </div>
        </div>
        <div className={styles.right}>
          <div className={styles.buttons}>
            {appchain && appchain.founder_id == window.accountId && (
              <Link to={`/update/${id}`}>
                <Button type='primary' icon={<EditOutlined />}>
                  Update
                </Button>
              </Link>
            )}

            <Button
              type='primary'
              icon={<CodeOutlined />}
              disabled={!appchainInitialized}
              onClick={() => setRPCModalVisible(true)}
            >
              RPC Call
            </Button>
          </div>
        </div>
      </div>

      <div className={styles.detail}>
        <div className={styles.left}>
          <div className={styles.baseInfo}>
            <span
              className={classnames(styles.tag, styles.id, styles.skeleton)}
            >
              {appchain && 'ID: ' + appchain.id}
            </span>
            {appchain && (
              <span className={classnames(styles.tag, styles.block)}>
                at block #{appchain.block_height}
              </span>
            )}
          </div>
          <div className={styles.baseInfo}>
            {appchain && (
              <a
                className={classnames(styles.tag, styles.link)}
                href={`${window.nearConfig.explorerUrl}/accounts/${appchain.founder_id}`}
                target='_blank'
              >
                <UserOutlined /> {appchain.founder_id}
              </a>
            )}
            {appchain?.website_url && (
              <a
                className={classnames(styles.tag, styles.link)}
                href={appchain.website_url}
                target='_blank'
              >
                <LinkOutlined /> Website
              </a>
            )}
            {appchain?.github_address && (
              <a
                className={classnames(styles.tag, styles.link)}
                href={appchain.github_address}
                target='_blank'
              >
                <GithubOutlined /> Github
              </a>
            )}
          </div>
        </div>
        <div className={styles.right}>
          <Descriptions column={3} layout="vertical" colon={false}>
            <Descriptions.Item label="Bonded">
              {appchain ? (
                <span> {appchain.bond_tokens} OCT </span>
              ) : (
                <span
                  className={styles.skeleton}
                  style={{ width: "200px", height: "24px" }}
                />
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Chain Spec">
              {appchain ? (
                appchain.chain_spec_hash ? (
                  <Popover content={appchain.chain_spec_url} placement="top">
                    <CopyToClipboard
                      text={`${appchain.chain_spec_url}`}
                      onCopy={() => message.info("Copied!")}
                    >
                      <div style={{ cursor: "pointer", display: "flex" }}>
                        <span
                          style={{
                            flex: "1",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                            overflow: "hidden",
                            maxWidth: "180px",
                          }}
                        >
                          {appchain.chain_spec_url}
                        </span>
                        <span style={{ marginLeft: "5px", color: "#aaa" }}>
                          <CopyOutlined />
                        </span>
                      </div>
                    </CopyToClipboard>
                  </Popover>
                ) : (
                  <span>Not Provided</span>
                )
              ) : (
                <span
                  className={styles.skeleton}
                  style={{ width: "200px", height: "24px" }}
                />
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Chain Spec Hash">
              {appchain ? (
                appchain.chain_spec_hash ? (
                  <Popover content={appchain.chain_spec_hash} placement="top">
                    <CopyToClipboard
                      text={`${appchain.chain_spec_hash}`}
                      onCopy={() => message.info("Copied!")}
                    >
                      <div style={{ cursor: "pointer", display: "flex" }}>
                        <span
                          style={{
                            flex: "1",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                            overflow: "hidden",
                            maxWidth: "180px",
                          }}
                        >
                          {appchain.chain_spec_hash}
                        </span>
                        <span style={{ marginLeft: "5px", color: "#aaa" }}>
                          <CopyOutlined />
                        </span>
                      </div>
                    </CopyToClipboard>
                  </Popover>
                ) : (
                  <span>Not Provided</span>
                )
              ) : (
                <span
                  className={styles.skeleton}
                  style={{ width: "200px", height: "24px" }}
                />
              )}
            </Descriptions.Item>
            {appchain && appchain.boot_nodes && (
              <Descriptions.Item label="Boot Nodes">
                <Popover content={appchain.boot_nodes} placement="bottom">
                  <CopyToClipboard
                    text={`${appchain.boot_nodes}`}
                    onCopy={() => message.info("Copied!")}
                  >
                    <div style={{ cursor: "pointer", display: "flex" }}>
                      <span
                        style={{
                          flex: "1",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                          overflow: "hidden",
                          maxWidth: "180px",
                        }}
                      >
                        {appchain.boot_nodes}
                      </span>
                      <span style={{ marginLeft: "5px", color: "#aaa" }}>
                        <CopyOutlined />
                      </span>
                    </div>
                  </CopyToClipboard>
                </Popover>
              </Descriptions.Item>
            )}
            {appchain && appchain.boot_nodes && (
              <Descriptions.Item label="Rpc Endpoint">
                <Popover content={appchain.rpc_endpoint} placement="bottom">
                  <CopyToClipboard
                    text={`${appchain.rpc_endpoint}`}
                    onCopy={() => message.info("Copied!")}
                  >
                    <div style={{ cursor: "pointer", display: "flex" }}>
                      <span
                        style={{
                          flex: "1",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                          overflow: "hidden",
                          maxWidth: "180px",
                        }}
                      >
                        {appchain.rpc_endpoint}
                      </span>
                      <span style={{ marginLeft: "5px", color: "#aaa" }}>
                        <CopyOutlined />
                      </span>
                    </div>
                  </CopyToClipboard>
                </Popover>
              </Descriptions.Item>
            )}
          </Descriptions>
        </div>
      </div>
      <div className={styles.chainStates}>
        {
          isLoading || appchainInitializing ?
          <div className={styles.loading} style={{ height: '62px' }}>
            <LoadingOutlined />
          </div> :
          appchainInitialized ?
          <>
          <div className={styles.statistic}>
            <span className={styles.num}>{finalizedBlock}</span>
            <em className={styles.desc}>Finalized</em>
          </div>
          <div className={styles.statistic}>
            <span className={styles.num}>{bestBlock}</span>
            <em className={styles.desc}>Best</em>
          </div>
          <div className={styles.statistic}>
            <span className={styles.num}>{totalIssuance}</span>
            <em className={styles.desc}>Total Issuance</em>
          </div>
          </> :
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ flex: 1, margin: '0', height: '62px' }}
            description='Appchain is not ready' />
        }
        
      </div>
      <div className={styles.explorer} style={{ marginTop: '30px' }}>
        <Tabs defaultActiveKey="blocks">
          <Tabs.TabPane tab="Blocks" key="blocks">

            {
              isLoading || appchainInitializing ?
              <div className={styles.loading} style={{ height: '200px' }}>
                <LoadingOutlined />
              </div> :
              appchainInitialized ?
              <BlockTable api={api} bestNumber={bestBlock} appchainId={id} /> :
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='Appchain is not ready' />
            }

          </Tabs.TabPane>
          <Tabs.TabPane tab="Validators" key="validators">
            <Table
              columns={columns}
              rowKey={(record) => record.account_id}
              loading={isLoading || isLoadingValidators}
              dataSource={validatorSet?.validators}
              pagination={false}
            />
          </Tabs.TabPane>
        </Tabs>
      </div>
      <RPCModal api={api} visible={rpcModalVisible} onOk={onRPCCallOk} 
        onCancel={() => setRPCModalVisible(false)} />
    </div>
  );
}

export default React.memo(Appchain);
