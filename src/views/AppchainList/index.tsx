import React, { useCallback, useEffect, useState } from 'react';

import { Button, Row, message, Card, Table } from 'antd';
import { PlusOutlined, RightOutlined } from '@ant-design/icons';

import Big from 'big.js';
import { Link, useNavigate } from "react-router-dom";
import styles from './styles.less';

import TokenBadge from "../../components/TokenBadge";
import Status from "../../components/Status";

import StakingModal from './StakingModal';
import ActiveModal from './ActiveModal';
import { readableAppchains } from "../../utils";

const BOATLOAD_OF_GAS = Big(3).times(10 ** 14).toFixed();

function Appchain(): React.ReactElement {

  const navigate = useNavigate();

  const [appchains, setAppchains] = useState<any[]>();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [appchainId, setAppchainId] = useState<number>(0);

  const [activeModalVisible, setActiveModalVisible] = useState<boolean>(false);
  const [stakingModalVisible, setStakingModalVisible] = useState<boolean>(false);

  const toggleStakingModalVisible = useCallback(() => {
    setStakingModalVisible(!stakingModalVisible);
  }, [stakingModalVisible]);

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

  useEffect(() => {
    setIsLoading(true);
    window.contract.get_num_appchains().then(num => window.contract.get_appchains({
      from_index: 0, limit: num
    })).then(olist => {
      const list = readableAppchains(olist);
      const t = []
      list.map((item, id) => {
        const t2 = {}
        Object.assign(t2, { id }, item);
        t.push(t2);
      });
    
      setAppchains(t);
      setIsLoading(false);
    })
    .catch(err => {
      console.log(err);
      message.error(err.toString());
      setIsLoading(false);
    });
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
    <div className='container' style={{ padding: '20px 0' }}>
      <div className={styles.title}>
        <h3 className={styles.text}>Appchains</h3>
        <Link to='/appchain/register'>
          <Button type='primary' icon={<PlusOutlined />}>Register</Button>
        </Link>
      </div>
      <Card bordered={false}>
        <Table rowKey={(record) => record.id} columns={columns} loading={isLoading} 
          dataSource={appchains} onRow={record => {
            return {
              onClick: event => navigate(`/appchain/${record.id}`)
            }
          }} />
      </Card>
      <ActiveModal appchainId={appchainId} visible={activeModalVisible} onCancel={() => setActiveModalVisible(false)} />
      <StakingModal appchainId={appchainId} visible={stakingModalVisible} onCancel={toggleStakingModalVisible} />
    </div>
  );
}

export default React.memo(Appchain);