import React, { useCallback, useEffect, useState } from "react";

import { Button, message, Pagination, Empty, Col, Row, notification } from "antd";
import { PlusOutlined, RightOutlined, LoadingOutlined, GlobalOutlined } from "@ant-design/icons";

import { Link, useNavigate } from "react-router-dom";
import styles from "./styles.less";

import { fromDecimals, readableAppchains } from "../../utils";

function AppchainList(): React.ReactElement {
  const navigate = useNavigate();

  const [appchains, setAppchains] = useState<any[]>();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [page, setPage] = useState(1);
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
          {appchains.map(({ 
            id, 
            founder_id, 
            validators_len, 
            staked_balance,
            status, 
            subql_url 
          }, idx) => (
              <Row key={idx} className={styles.appchain} justify="center" 
                onClick={(e) => navigate(`/appchains/${id}`)} align="middle">
                <Col span={4} className={styles.name}>{id}</Col>
                <Col span={5}>{founder_id}</Col>
                <Col span={5}>{validators_len}</Col>
                <Col span={4}>{fromDecimals(staked_balance)} OCT</Col>
                <Col span={4}>
                  <span className={`${styles.status} ${styles[status]}`}>
                    {status}
                  </span>
                </Col>
                <Col span={2}>
                  <Row align="middle" justify="end">
                    {
                      status == 'Booting' && subql_url ?
                      <Button shape="circle" icon={<GlobalOutlined />} href={
                          window.contractName == 'octopus-relay.testnet' ? 
                          `http://explorer.testnet.oct.network/?appchain=${id}` : 
                          `http://explorer.dev.oct.network/?appchain=${id}`
                        } target="_blank" style={{ marginRight: 10, border: 'none' }} /> :
                      null
                    }
                    <RightOutlined
                      style={{ fontSize: "14px", color: "#ccc" }}
                    />
                  </Row>
                </Col>
              </Row>
            )
          )}
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
     
    </div>
  );
}

export default React.memo(AppchainList);
