import React, { useState, useEffect, useCallback } from "react";

import { ApiPromise, WsProvider } from '@polkadot/api';
import { formatBalance, u8aToHex } from '@polkadot/util';
import { encodeAddress } from '@polkadot/util-crypto';

import { utils } from "near-api-js";
import {
  Row,
  Col,
  Descriptions,
  message,
  Table,
  Button,
  Result,
  Tabs,
  Popconfirm,
  Empty,
  Tooltip,
  notification
} from "antd";

import {
  CheckOutlined,
  RightOutlined,
  SelectOutlined,
  CopyOutlined,
  GithubOutlined,
  EditOutlined,
  CodeOutlined,
  UserOutlined,
  MailOutlined,
  CloudServerOutlined,
  LinkOutlined,
  LoadingOutlined
} from "@ant-design/icons";

import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import Big from "big.js";
import { CopyToClipboard } from "react-copy-to-clipboard";
import classnames from "classnames";

import styles from "./styles.less";
import { readableAppchain } from "../../utils";

import BlockTable from './BlockTable';
import RPCModal from './RPCModal';
import DeployModal from './DeployModal';
import ApproveModal from "./ApproveModal";
import ActivateModal from "./ActivateModal";
import StakeModal from "./StakeModal";
import Hash from '../../components/Hash';

const BOATLOAD_OF_GAS = Big(3)
  .times(10 ** 14)
  .toFixed();

function Appchain(): React.ReactElement {

  const { id, tab } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [appchain, setAppchain] = useState<any>();

  const [isLoadingValidators, setIsLoadingValidators] = useState<boolean>(
    false
  );
  const [currValidatorSetIdx, setCurrValidatorSetIdx] = useState<number>(0);
  const [appchainValidatorIdex, setAppchainValidatorIdx] = useState<number>(0);
  const [validatorSet, setValidatorSet] = useState<any>();

  const [rpcModalVisible, setRPCModalVisible] = useState(false);
  const [deployModalVisible, setDeployModalVisible] = useState(false);
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [activateModalVisible, setActivateModalVisible] = useState(false);
  const [stakeModalVisible, setStakeModalVisible] = useState(false);

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
      title: "Appchain Validator Account",
      dataIndex: "id",
      key: "id",
      render: (accountId) => {
      
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
    
    Promise.all([
      window.contract.get_appchain({ appchain_id: id }),
      window.contract.get_curr_validator_set_len({ appchain_id: id }),
    ]).then(([appchain, idx]) => {
      setIsLoading(false);
      setAppchain(readableAppchain(appchain));
      setCurrValidatorSetIdx(idx);
      setAppchainValidatorIdx(idx);
      if (appchain.status == 'Booting') {
        initAppchain(appchain);
      }
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
  const [isRemoving, setIsRemoving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const initAppchain = async (appchain) => {
    
    let types = {};
    try {
      types = await require(`../../customTypes/${appchain.id}.json`);
    } catch(err) {}
    
    setAppchainInitializing(true);
    let provider = new WsProvider(appchain.rpc_endpoint);
    const api = new ApiPromise({ provider, types: types || {} });

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
  }

  const onRPCCallOk = useCallback((res) => {
    console.log(res);
    setRPCModalVisible(false);
    message.success('RPC Call Success!');
  }, []);

  const onRemoveAppchain = (id) => {
    setIsRemoving(true);
    window.contract
      .remove_appchain(
        {
          appchain_id: id,
        },
        BOATLOAD_OF_GAS,
        0
      )
      .then(() => {
        navigate('/appchains');
      })
      .catch((err) => {
        setIsRemoving(false);
        message.error(err.toString());
      });
  }

  const onTabChange = (tabId) => {
    navigate(`/appchains/${id}/${tabId}`)
  }

  const onPassAppchain = () => {
    setIsApproving(true);
    window.contract.pass_appchain(
      {
        appchain_id: id
      },
      BOATLOAD_OF_GAS,
      0
    )
    .then(() => {
      navigate(0);
    })
    .catch((err) => {
      setIsApproving(false);
      message.error(err.toString());
    });
  }

  const onGoStaging = () => {
    setIsApproving(true);
    window.contract.appchain_go_staging(
      {
        appchain_id: id
      },
      BOATLOAD_OF_GAS,
      0
    )
    .then(() => {
      navigate(0);
    })
    .catch((err) => {
      setIsApproving(false);
      message.error(err.toString());
    });
  }

  return (
    <div className='container' style={{ padding: '20px 0' }}>
      <div className={styles.title}>
        <div className={styles.left}>
          <div className={styles.breadcrumb}>
            <Link to='/appchains'>Appchains</Link>
            <span className={styles.arrow}>
              <RightOutlined />
            </span>
            <span className={classnames(styles.name, styles.skeleton)}>
              {appchain?.id}
            </span>
          </div>
          <div className={styles.appchainName}>
            <span className={classnames(styles.text, styles.skeleton)}>
              {appchain?.id}
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
          {
            window.accountId == window.contractName ?
            <div className={styles.buttons}>
              {
                appchain?.status == 'Auditing' ?
                <Button type='primary' loading={isApproving} icon={<CheckOutlined />} onClick={onPassAppchain}>
                  Pass
                </Button> :
                appchain?.status == 'InQueue' ?
                <Button type='primary' loading={isApproving} onClick={onGoStaging}>
                  Go staging
                </Button> : 
                appchain?.status == 'Staging' ?
                <Button type='primary' onClick={() => setActivateModalVisible(true)}>
                  Activate
                </Button> : null
              }
              {
                appchain?.status == 'Auditing' &&
                <Popconfirm
                  title="Are you sure to reject this appchain?"
                  onConfirm={() => onRemoveAppchain(appchain?.id)}
                >
                  <Button type="ghost" danger disabled={isRemoving} loading={isRemoving} 
                    style={{ background: 'transparent' }}>
                    Reject
                  </Button>
                </Popconfirm>
              }
            </div> :
            <div className={styles.buttons}>
              {
                appchain?.founder_id == window.accountId ?
                appchain?.status != 'Auditing' &&
                (
                  <Link to={`/update/${id}`}>
                    <Button type='primary' icon={<EditOutlined />}>
                      Update
                    </Button>
                  </Link>
                ) :
                <>
                {
                  (
                    appchain?.status == 'Booting' ||
                    appchain?.status == 'Staging' 
                  ) &&
                  <Button onClick={() => setStakeModalVisible(true)}
                  >
                    Stake
                  </Button>
                }
                <Button 
                  icon={<CloudServerOutlined />} 
                  disabled={!appchainInitialized}
                  onClick={() => setDeployModalVisible(true)}
                >
                  Deploy Validator
                </Button>
                <Button
                  type='primary'
                  style={{ marginLeft: '15px' }}
                  icon={<CodeOutlined />}
                  disabled={!appchainInitialized}
                  onClick={() => setRPCModalVisible(true)}
                >
                  RPC Call
                </Button>
                </>
              } 
                
            </div>
          }
          
        </div>
      </div>

      <Row className={styles.detail}>
        <Col className={styles.left} span={appchain?.status != 'Booting' ? 24 : 7}>
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
            {appchain && (
              <span className={classnames(styles.tag, styles.block)}>
                at block #{appchain.block_height}
              </span>
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
            {appchain && (
              <a
                className={classnames(styles.tag, styles.link)}
                href={appchain.github_address}
                target='_blank'
              >
                <GithubOutlined /> Github
              </a>
            )}
            {appchain && (
              <a
                className={classnames(styles.tag, styles.link)}
                href={appchain.github_release}
                target='_blank'
              >
                <GithubOutlined /> Release
              </a>
            )}
            {appchain && (
              <span
                className={classnames(styles.tag, styles.block)}
              >
                commit {appchain.commit_id?.substr(0,7)}
              </span>
            )}
          </div>
        </Col>
        <Col span={17} className={styles.right} style={{ display: appchain?.status != 'Booting' ? 'none' : 'flex' }}>
          <Descriptions column={3} layout="vertical" colon={false}>
            {/* <Descriptions.Item label="Bonded">
              {appchain ? (
                <span> {appchain.bond_tokens} OCT </span>
              ) : (
                <span
                  className={styles.skeleton}
                  style={{ width: "200px", height: "24px" }}
                />
              )}
            </Descriptions.Item> */}
            <Descriptions.Item label="Chain Spec">
              {appchain ? (
                appchain.chain_spec_url ? (
                  
                  <Row>
                    <Col span={24}>
                      <Tooltip title={appchain.chain_spec_url}>
                        <CopyToClipboard
                          text={`${appchain.chain_spec_url}`}
                          onCopy={() => message.info("Copied!")}
                        >
                          <div style={{ cursor: "pointer", display: "flex" }}>
                            <span className={styles.descriptionItemRow}>
                              Url: {appchain.chain_spec_url}
                            </span>
                            <span style={{ marginLeft: "5px", color: "#aaa" }}>
                              <CopyOutlined />
                            </span>
                          </div>
                        </CopyToClipboard>
                      </Tooltip>
                    </Col>
                    <Col span={24} style={{ marginTop: 5 }}>
                      <Hash value={appchain?.chain_spec_hash} noCopy0x />
                    </Col>
                  </Row>
     
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
            <Descriptions.Item label="Chain Spec Raw">
              {appchain ? (
                appchain.chain_spec_raw_url ? (
                  <Row>
                    <Col span={24}>
                      <Tooltip title={appchain.chain_spec_raw_url}>
                        <CopyToClipboard
                          text={`${appchain.chain_spec_raw_url}`}
                          onCopy={() => message.info("Copied!")}
                        >
                          <div style={{ cursor: "pointer", display: "flex" }}>
                            <span className={styles.descriptionItemRow}>
                              Url: {appchain.chain_spec_raw_url}
                            </span>
                            <span style={{ marginLeft: "5px", color: "#aaa" }}>
                              <CopyOutlined />
                            </span>
                          </div>
                        </CopyToClipboard>
                      </Tooltip>
                    </Col>
                    <Col span={24} style={{ marginTop: 5 }}>
                      <Hash value={appchain?.chain_spec_raw_hash} noCopy0x />
                    </Col>
                  </Row>
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
                <Tooltip title={appchain.boot_nodes}>
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
                </Tooltip>
              </Descriptions.Item>
            )}
            {appchain && appchain.boot_nodes && (
              <Descriptions.Item label="Rpc Endpoint">
                <Tooltip title={appchain.rpc_endpoint}>
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
                </Tooltip>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Col>
      </Row>
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
          window.accountId == appchain?.founder_id && appchain?.status == 'Auditing' ?
          <div style={{ flex: 1, alignItems: 'center', display: 'flex', justifyContent: 'center' }}>
            <Result
              title="Your appchain registration is in process"
              subTitle="Copy this link and send mail to our team will speed up the process:)"
              extra={[
                <CopyToClipboard
                  text={`Hello Octopus team, just finished my appchain registration: ${window.location.href}, please check. Thanks~`}
                  onCopy={() => message.info("Link copied!")}
                >
                  <Button key="copy" icon={<CopyOutlined />}>Copy link</Button>
                </CopyToClipboard>,
                
                <Button key="email" type="ghost" icon={<MailOutlined />} href={`mailto:appchain@oct.network`} target="_blank"
                  style={{ borderColor: '#53ab90', color: '#53ab90' }}>Send email</Button>
              
              ]}
            />
          </div> :
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ flex: 1, margin: '0', height: '62px' }}
            description='Appchain is not ready' />
        }
        
      </div>
      <div className={styles.explorer} style={{ 
        marginTop: '30px', 
        display: window.accountId == appchain?.founder_id && appchain?.status == 'Auditing' ? 'none' : 'block'
      }}>
        <Tabs defaultActiveKey={tab || 'blocks'} onChange={onTabChange}>
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
              dataSource={appchain?.validators}
              pagination={false}
            />
          </Tabs.TabPane>
        </Tabs>
      </div>
      <RPCModal api={api} visible={rpcModalVisible} onOk={onRPCCallOk} 
        onCancel={() => setRPCModalVisible(false)} />
      <DeployModal appchain={appchain} visible={deployModalVisible} onCancel={() => setDeployModalVisible(false)} />
      {/* <ApproveModal visible={approveModalVisible} appchainId={appchain?.id} onCancel={() => setApproveModalVisible(false)} /> */}
      <ActivateModal visible={activateModalVisible} appchainId={appchain?.id} onCancel={() => setActivateModalVisible(false)} />
      <StakeModal visible={stakeModalVisible} appchainId={appchain?.id} onCancel={() => setStakeModalVisible(false)} />
    </div>
  );
}

export default React.memo(Appchain);
