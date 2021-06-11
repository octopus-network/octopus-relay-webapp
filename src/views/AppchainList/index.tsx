import React, { useCallback, useEffect, useState } from "react";

import { Button, message, Pagination, Empty, Col, Row } from "antd";
import { PlusOutlined, RightOutlined, LoadingOutlined } from "@ant-design/icons";

import Big from "big.js";
import { Link, useNavigate } from "react-router-dom";
import styles from "./styles.less";

import { readableAppchains } from "../../utils";

function AppchainList(): React.ReactElement {
  const navigate = useNavigate();

  const [appchains, setAppchains] = useState<any[]>();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [appchainId, setAppchainId] = useState<number>(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const loadPage = async (p) => {
    setIsLoading(true);
    const start = (p -1) * pageSize;
    const res = await window.contract.get_appchains({
      from_index: start,
      limit: pageSize,
    });
    const list = readableAppchains(res);
    const t = [];
    list.map((item, id) => {
      const t2 = {};
      Object.assign(t2, { id }, item);
      t.push(t2);
    });

    setAppchains(t);
    setIsLoading(false);
  }

  useEffect(() => {
    loadPage(page);
  }, [page]);

  useEffect(() => {
    setIsLoading(true);
    window.contract
      .get_num_appchains()
      .then((num) => {
        setTotalCount(num);
        if (num > 0) {
          setPage(1);
        } else {
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.log(err);
        message.error(err.toString());
        setIsLoading(false);
      });

    // check current account is admin or not
    if (window.accountId) {
      
      if (window.accountId == window.nearConfig.contractName) {
        setIsAdmin(true);
      }
    }
  }, []);

  return (
    <div className="container" style={{ padding: "20px 0" }}>
      <div className={styles.title}>
        <h3 className={styles.text}>Appchains</h3>
        <Link to="/appchains/register">
          <Button type="primary" icon={<PlusOutlined />}>
            Appchain
          </Button>
        </Link>
      </div>
      <Row style={{ padding: '15px 25px', color: '#9c9c9c' }}>
        <Col span={4}>ID</Col>
        <Col span={5}>Founder</Col>
        <Col span={5}>Validators</Col>
        <Col span={5}>Staked</Col>
        <Col span={4}>Status</Col>
      </Row>
      {
        isLoading ?
       
        <div className={styles.loading}>
          <LoadingOutlined />
        </div> :

        appchains?.length ?
        <>
          {appchains.map(({ id, founder_id, validators, bond_tokens, status }, idx) => {
            
            return (
              <Row key={idx} className={styles.appchain} justify="center" 
                onClick={(e) => navigate(`/appchains/${id}`)} align="middle">
                <Col span={4} className={styles.name}>{id}</Col>
                <Col span={5}>{founder_id}</Col>
                <Col span={5}>{validators.length}</Col>
                <Col span={5}>{bond_tokens} OCT</Col>
                <Col span={4}>
                  <span className={`${styles.status} ${styles[status]}`}>
                    {status}
                  </span>
                </Col>
                <Col span={1}>
                  {/* <ActionButtons
                    founder_id={founder_id}
                    onActive={() => activeAppchain(id)}
                    onFreeze={() => freezeAppchain(id)}
                    onRemove={() => removeAppchain(id)}
                    onStake={() => {
                      setAppchainId(id);
                      toggleStakingModalVisible();
                    }}
                  /> */}
                  <Row align="middle" justify="end">
                    <RightOutlined
                      style={{ fontSize: "14px", color: "#ccc" }}
                    />
                  </Row>
                </Col>
              </Row>
            );
          })}
          {
            appchains?.length > pageSize &&
            <Row justify="center" style={{ marginTop: 30 }}>
              <Pagination current={page} pageSize={pageSize} onChange={p => {
                setPage(p);
              }} total={totalCount} />
            </Row>
          }
        </> :
        <div style={{ padding: 30 }}>
          <Empty description={<span style={{ color: '#7c7c7c' }}>There is no appchains</span>} />
        </div>
      }
      {/* <Card bordered={false}>
        <Table
          rowKey={(record) => record.id}
          columns={columns}
          loading={isLoading}
          dataSource={appchains}
          onRow={(record) => {
            return {
              onClick: (event) => navigate(`/appchain/${record.id}`),
            };
          }}
        />
      </Card> */}
     
    </div>
  );
}

export default React.memo(AppchainList);
