import React, { useState, useEffect, useCallback } from 'react';

import {
  Row,
  Col,
  Result,
  Empty,
  Button,
  message,
  notification,
  Card,
  Skeleton,
  Divider,
  Tooltip,
  Descriptions,
  Popconfirm
} from 'antd';

import {
  CopyOutlined,
  MailOutlined,
  LoadingOutlined,
  UserOutlined,
  GithubOutlined,
  GlobalOutlined,
  LinkOutlined,
  CheckOutlined,
  EditOutlined,
  CloudServerOutlined,
  CodeOutlined
} from "@ant-design/icons";

import Big from "big.js";
import classnames from "classnames";
import { ApiPromise, WsProvider } from '@polkadot/api';
import { formatBalance } from '@polkadot/util';
import { CopyToClipboard } from "react-copy-to-clipboard";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { readableAppchain, fromDecimals } from "../../../utils";
import BlockTable from './BlockTable';
import Hash from '../../../components/Hash';

import RPCModal from './RPCModal';
import DeployModal from './DeployModal';
import ActivateModal from "./ActivateModal";
import SubqlModal from "./SubqlModal";

import styles from './styles.less';

const BOATLOAD_OF_GAS = Big(3)
  .times(10 ** 14)
  .toFixed();

const Overview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const id = location.pathname.split('/')[2];
 
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [appchain, setAppchain] = useState<any>();
  const [appchainInitializing, setAppchainInitializing] = useState(false);
  const [appchainInitialized, setAppchainInitialized] = useState(false);
  const [finalizedBlock, setFinalizedBlock] = useState(0);
  const [bestBlock, setBestBlock] = useState(0);
  const [totalIssuance, setTotalIssuance] = useState('0');
  const [api, setApi] = useState<any>();

  const [isRemoving, setIsRemoving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isFreezing, setIsFreezing] = useState(false);

  const [rpcModalVisible, setRPCModalVisible] = useState(false);
  const [deployModalVisible, setDeployModalVisible] = useState(false);
  const [activateModalVisible, setActivateModalVisible] = useState(false);
  const [stakeModalVisible, setStakeModalVisible] = useState(false);
  const [subqlModalVisible, setSubqlModalVisible] = useState(false);

  const isAdmin = window.accountId && (
    new RegExp(`\.${window.accountId}`).test(window.contractName) ||
    window.accountId === window.contractName
  );

  const isOwner = window.accountId && appchain?.founder_id === window.accountId;

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    window.contract
      .get_appchain({ appchain_id: id })
      .then(appchain => {
        setIsLoading(false);
        setAppchain(readableAppchain(appchain));
        if (appchain.status == 'Booting') {
          initAppchain(appchain);
        }
      });
  
  }, [id]);

  const initAppchain = async (appchain) => {
    
    let types = {};
    try {
      types = await require(`../../../customTypes/${appchain.id}.json`);
    } catch(err) {
      types = await require(`../../../customTypes/defaultAppchain.json`);
    }
    
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
        // message.error(err.toString());
      });
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
      // message.error(err.toString());
    });
  }

  const onFreezeAppchain = () => {
    setIsFreezing(true);
    window.contract.freeze_appchain(
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
      setIsFreezing(false);
      // message.error(err.toString());
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
      // message.error(err.toString());
    });
  }

  const onRPCCallOk = useCallback((res) => {
    console.log(res);
    setRPCModalVisible(false);
    message.success('RPC Call Success!');
  }, []);

  return (
    <>
    <Row gutter={[20, 20]}>
      <Col span={17}>
        <Card title="Chain states" bordered={false}>
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
            isOwner && appchain?.status == 'Auditing' ?
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
        </Card>
        <Card title="Recent blocks" style={{ marginTop: '20px' }} bordered={false}>
        <div className={styles.explorer} style={{ 
          display: isOwner && appchain?.status == 'Auditing' ? 'none' : 'block'
        }}>
          {
            isLoading || appchainInitializing ?
            <div className={styles.loading} style={{ height: '200px' }}>
              <LoadingOutlined />
            </div> :
            appchainInitialized ?
            <BlockTable api={api} bestNumber={bestBlock} appchainId={id} /> :
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='Appchain is not ready' />
          }
        </div>
        </Card>
      </Col>
      <Col span={7}>
        <Card title="Actions" bordered={false}>
          {
            isAdmin ?
            <div className={styles.buttons}>
              {
                appchain?.status == 'Auditing' ?
                <Button type='primary' loading={isApproving} icon={<CheckOutlined />} onClick={onPassAppchain}>
                  Pass
                </Button> :
                appchain?.status == 'Voting' ?
                <Button type='primary' loading={isApproving} onClick={onGoStaging}>
                  Go staging
                </Button> : 
                appchain?.status == 'Staging' ?
                <Button type='primary' onClick={() => setActivateModalVisible(true)}>
                  Activate
                </Button> :
                appchain?.status == 'Booting' ?
                <>
                  <Button type='primary' onClick={() => setSubqlModalVisible(true)}>
                    Update Subql Url
                  </Button>
                  <Button loading={isFreezing} onClick={onFreezeAppchain} style={{ marginLeft: 10 }}>
                    Freeze Appchain
                  </Button>
                </> : null
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
                isOwner ?
                appchain?.status != 'Auditing' &&
                (
                  <Link to={`/update/${id}`}>
                    <Button type='primary' icon={<EditOutlined />}>
                      Update
                    </Button>
                  </Link>
                ) :
                <>
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
        </Card>
        
        <Card title="Appchain Info" style={{ marginTop: '20px' }} bordered={false}>
          <Skeleton loading={!appchain} active>
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

              {appchain?.subql_url && appchain.status == 'Booting' && (
                <a
                  className={classnames(styles.tag, styles.link)}
                  href={
                    window.contractName == 'beta.beta_oct_relay.testnet' ? 
                    `http://explorer.testnet.oct.network/?appchain=${id}` : 
                    `http://explorer.dev.oct.network/?appchain=${id}`
                  }
                  target='_blank'
                >
                  <GlobalOutlined /> Explorer
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
            <Divider />
            <Descriptions column={1} labelStyle={{ width: '120px' }}>
              {
                appchain && appchain.chain_spec_url &&
                <Descriptions.Item label="Chain Spec">
                  <Row>
                    <Col span={24}>
                      <Tooltip title={appchain.chain_spec_url}>
                        <CopyToClipboard
                          text={`${appchain.chain_spec_url}`}
                          onCopy={() => message.info("Copied!")}
                        >
                          <div style={{ cursor: "pointer", display: "flex" }}>
                            <span className={styles.descriptionItemRow}>
                              {appchain.chain_spec_url}
                            </span>
                            <span style={{ marginLeft: "5px", color: "#aaa" }}>
                              <CopyOutlined />
                            </span>
                          </div>
                        </CopyToClipboard>
                      </Tooltip>
                    </Col>
                    <Col span={24}>
                      <Hash value={appchain?.chain_spec_hash} noCopy0x />
                    </Col>
                  </Row>
                </Descriptions.Item>
              }
              {
                appchain && appchain.chain_spec_raw_url &&
                <Descriptions.Item label="Chain Spec Raw">
                  <Row>
                    <Col span={24}>
                      <Tooltip title={appchain.chain_spec_raw_url}>
                        <CopyToClipboard
                          text={`${appchain.chain_spec_raw_url}`}
                          onCopy={() => message.info("Copied!")}
                        >
                          <div style={{ cursor: "pointer", display: "flex" }}>
                            <span className={styles.descriptionItemRow}>
                              {appchain.chain_spec_raw_url}
                            </span>
                            <span style={{ marginLeft: "5px", color: "#aaa" }}>
                              <CopyOutlined />
                            </span>
                          </div>
                        </CopyToClipboard>
                      </Tooltip>
                    </Col>
                    <Col span={24}>
                      <Hash value={appchain?.chain_spec_raw_hash} noCopy0x />
                    </Col>
                  </Row>
                </Descriptions.Item>
              }
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
              {appchain && appchain.rpc_endpoint && (
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
          </Skeleton>
        </Card>
      </Col>
    </Row>
    <RPCModal api={api} visible={rpcModalVisible} onOk={onRPCCallOk} 
      onCancel={() => setRPCModalVisible(false)} />
    <DeployModal appchain={appchain} visible={deployModalVisible} onCancel={() => setDeployModalVisible(false)} />
    {/* <ApproveModal visible={approveModalVisible} appchainId={appchain?.id} onCancel={() => setApproveModalVisible(false)} /> */}
    <ActivateModal visible={activateModalVisible} appchainId={appchain?.id} onCancel={() => setActivateModalVisible(false)} />
    <SubqlModal subqlUrl={appchain?.subql_url || ''} visible={subqlModalVisible} appchainId={appchain?.id} onCancel={() => setSubqlModalVisible(false)} />
    
    </>
  );
}

export default Overview;