import React, { useCallback, useEffect, useState } from "react";
import { Row, Col, Button, Table, Card, message, Statistic } from "antd";

import { PlusOutlined, RightOutlined, HomeFilled } from "@ant-design/icons";

import { utils } from 'near-api-js';
import { Link, useNavigate } from "react-router-dom";

import Big from 'big.js';

import StakingModal from './StakingModal';
import ActiveModal from './ActiveModal';

import TokenBadge from "../../components/TokenBadge";
import Status from "../../components/Status";

import styles from './styles.less';

const BOATLOAD_OF_GAS = Big(3).times(10 ** 14).toFixed();

function Home(): React.ReactElement {

  const navigate = useNavigate();

  let isSignedIn = window.walletConnection?.isSignedIn();

  const [isLoadingList, setIsLoadingList] = useState<boolean>(false);

  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const [activeModalVisible, setActiveModalVisible] = useState<boolean>(false);
  const [stakingModalVisible, setStakingModalVisible] = useState<boolean>(false);

  const [numberAppchains, setNumberAppchains] = useState<number>(0);

  const [stakedBalance, setStakedBalance] = useState<number>(0);

  const [appchains, setAppchains] = useState<any[]>();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [appchainId, setAppchainId] = useState<number>(0);

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
    },
    {
      title: "Name",
      dataIndex: "appchain_name",
    },
    {
      title: "Founder",
      dataIndex: "founder_id",
    },
    {
      title: "Validators",
      key: "validators",
      render: (_, fields) => {
        const { validators } = fields;
        return <span>{validators.length}</span>
      }
    },
    {
      title: "Staked",
      key: "Staked",
      render: (_, fields) => {
        const { validators } = fields;
        let totalStaked = 0;
        validators.map(v => totalStaked += v.staked_amount);
        return (
          <span>
            { totalStaked } <TokenBadge />
          </span>
        )
      }
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text) => {
        return (
          <Status type={text} />
        );
      }
    },
    {
      title: "",
      key: "action",
      render: (text, fields) => {
        const { id, validators, founder_id, status } = fields;

        return (
          <Row justify="end" align="middle" onClick={e => e.stopPropagation()}>
            {
              window.accountId &&
              (

                isAdmin ?
               
                status == 'Frozen' ?
                <Button type='primary' onClick={() => activeAppchain(fields.id)}>
                  Active
                </Button> : (
                  status == 'Active' ?
                  <Button type='ghost' onClick={() => freezeAppchain(fields.id)}>
                    Freeze
                  </Button> : null
                ) :
          
                window.accountId != founder_id ?

                <Button onClick={() => { setAppchainId(fields.id); toggleStakingModalVisible(); }} type="ghost">Staking</Button> : null
             
              )
            }
            <RightOutlined style={{ marginLeft: '10px', fontSize: '14px', color: '#ccc' }} />
          </Row>
        );
      }
    }
  ];

  const toggleStakingModalVisible = useCallback(() => {
    setStakingModalVisible(!stakingModalVisible);
  }, [stakingModalVisible]);

  const getAppchains = useCallback(() => {
    setIsLoadingList(true);
   
    Promise.all([
        window.contract.get_num_appchains(),
        window.contract.get_total_staked_balance(),
      ])
      .then(([num_appchains, stakedBlance]) => {

        setNumberAppchains(num_appchains);

        setStakedBalance(stakedBlance);

        return window.contract.get_appchains({from_index: 0, limit: num_appchains});
      })
      .then(list => {
        const t = []
        list.map((item, id) => {
          const t2 = {}
          Object.assign(t2, { id }, item);
          t.push(t2);
        });
     
        setAppchains(t);
        setIsLoadingList(false);
      })
      .catch(err => {
        console.log(err);
        message.error(err.toString());
        setIsLoadingList(false);
      })
  }, []);

  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [currBlock, setCurrBlock] = useState<number>(0);

  // initialize
  useEffect(() => {
    getAppchains();

    // check current account is admin or not
    if (window.accountId) {
      window.contract?.get_owner().then(owner => {
        if (window.accountId == owner) {
          setIsAdmin(true);
        }
      });
    }

    let timer = setInterval(() => {
      if (isFetching) return false;
      setIsFetching(true);
      utils.web.fetchJson(window.walletConnection._near?.config.nodeUrl, JSON.stringify({
        "jsonrpc": "2.0",
        "id": "dontcare",
        "method": "block", 
        "params": {
            "finality": "final"
        }
      })).then(({ result }) => {
        setCurrBlock(result.header.height);
      }).finally(() => {
        setIsFetching(false);
      });
    }, 1000);

    return () => {
      clearInterval(timer)
    };

  }, []);

  const activeAppchain = function(appchainId) {
    setAppchainId(appchainId);
    setActiveModalVisible(true);
  }

  const freezeAppchain = function(appchainId) {
    setIsLoading(true);
    window.contract.freeze_appchain(
      {
        appchain_id: appchainId,
      },
      BOATLOAD_OF_GAS,
      0
    ).then(() => {
      window.location.reload();
    }).catch((err) => {
      setIsLoading(false);
      message.error(err.toString());
    });
  }

  return (
    <> 
    
      <div className={styles.overview}>
        <Card title="Overview" bordered={false}>
          <Row gutter={16}>
            <Col span={8}>
              <Statistic title="Total Appchains" value={numberAppchains} />
            </Col>
            <Col span={8}>
              <Statistic title="Staked"  value={stakedBalance} suffix={<TokenBadge />} />
            </Col>
            <Col span={8}>
              <Statistic title="Block Height" value={currBlock} />
            </Col>
          </Row>
        </Card>
      </div>
      <div style={{ marginTop: "15px" }}>
        <Card title="Appchains" extra={
          isSignedIn &&
          <Link to="/register">
            <Button type="primary" icon={<PlusOutlined />}>Register</Button>
          </Link>
        } bordered={false}>
          <Table rowKey={(record) => record.id} columns={columns} loading={isLoadingList || isLoading} 
            dataSource={appchains} onRow={record => {
              return {
                onClick: event => navigate(`/appchain/${record.id}`)
              }
            }} />
        </Card>
      </div>
      <ActiveModal appchainId={appchainId} visible={activeModalVisible} onCancel={() => setActiveModalVisible(false)} />
      <StakingModal appchainId={appchainId} visible={stakingModalVisible} onCancel={toggleStakingModalVisible} />
    </>
  );
}

export default React.memo(Home);