import React, { useCallback, useEffect, useState } from "react";
import { Row, Col, Button, Table, Card, message, Statistic } from "antd";

import { utils } from "near-api-js";

import { useNavigate } from "react-router-dom";

import Overview from "./Overview";

import styles from "./styles.less";

import { fromDecimals, readableAppchains } from "../../utils";

function Home(): React.ReactElement {
  const navigate = useNavigate();

  const [isLoadingList, setIsLoadingList] = useState<boolean>(false);

  const [numberAppchains, setNumberAppchains] = useState<number>(0);

  const [stakedBalance, setStakedBalance] = useState<number>(0);

  const [appchains, setAppchains] = useState<any[]>();

  const getSortedAppchains = useCallback(() => {
    setIsLoadingList(true);

    window.contract
      .get_num_appchains()
      .then((num) => {
        setNumberAppchains(num);
        let promises = [];
        for (let i = 0; i < num; i++) {
          promises.push(
            window.contract.get_appchain({
              appchain_id: i,
            })
          );
        }
        return Promise.all(promises);
      })
      .then((oAppchains) => {
        setIsLoadingList(false);
        if (oAppchains.length <= 0) return;

        const appchains = readableAppchains(oAppchains);

        appchains.sort((a, b) => {
          const statusRank = {
            Active: 99,
            InProgress: 98,
            Frozen: 97,
            Broken: 0,
          };
          const validators0 = a.validators,
            validators1 = b.validators;
          const totalStaked0 = validators0.reduce(
              (total, b) => total + b.staked_amount,
              0
            ),
            totalStaked1 = validators1.reduce(
              (total, b) => total + b.staked_amount,
              0
            );

          // sort
          if (a.status == b.status) {
            if (validators0.length == validators1.length) {
              if (totalStaked0 == totalStaked1) {
                return b.id - a.id;
              } else {
                return totalStaked1 - totalStaked0;
              }
            } else {
              return validators1.length - validators0.length;
            }
          } else {
            return statusRank[b.status] - statusRank[a.status];
          }
        });

        setAppchains(appchains.slice(0,5));
      })
      .catch((err) => {
        console.log(err);
        message.error(err.toString());
        setIsLoadingList(false);
      });
  }, []);

  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [currBlock, setCurrBlock] = useState<number>(0);

  // initialize
  useEffect(() => {
    getSortedAppchains();
    window.contract
      .get_total_staked_balance()
      .then((balance) => setStakedBalance(fromDecimals(balance)));

    let timer = setInterval(() => {
      if (isFetching) return false;
      setIsFetching(true);
      utils.web
        .fetchJson(
          window.walletConnection._near?.config.nodeUrl,
          JSON.stringify({
            jsonrpc: "2.0",
            id: "dontcare",
            method: "block",
            params: {
              finality: "final",
            },
          })
        )
        .then(({ result }) => {
          setCurrBlock(result.header.height);
        })
        .finally(() => {
          setIsFetching(false);
        });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <>
      <div style={{ marginTop: "-75px", zIndex: -1 }}>
        <Overview
          height={235}
          paddingTop={75}
          numberAppchains={numberAppchains}
          stakedBalance={stakedBalance}
          blockHeight={currBlock}
        />
      </div>
      <div style={{ marginTop: "50px" }} className="container">
        <div className={styles.sectionTitle}>
          <span>Hot Appchains</span>
        </div>
        <div className={styles.appchainList}>
          <Row className={styles.header}>
            <Col span={11}>Name</Col>
            <Col span={5}>Validators</Col>
            <Col span={4}>Staked</Col>
            <Col span={4}>
              <Row justify="end">Status</Row>
            </Col>
          </Row>
          <div className={styles.content}>
            {isLoadingList ? (
              <>
                {[0, 1].map((_, idx) => {
                  return (
                    <Row className={styles.skeleton} key={idx}>
                      <Col span={11}>
                        <i className={styles.circle} />
                        <span className={styles.name} />
                      </Col>
                      <Col span={13} className={styles.rest} />
                    </Row>
                  );
                })}
              </>
            ) : appchains && appchains.length ? (
              appchains.map((item, idx) => {
                const { id, appchain_name, validators, status } = item;
                const totalStaked = validators.reduce(
                  (total, b) => total + b.staked_amount,
                  0
                );
                return (
                  <Row
                    className={styles.appchain}
                    key={idx}
                    onClick={(e) => navigate(`/appchain/${id}`)}
                  >
                    <Col span={11}>
                      <i className={styles.id}>{idx + 1}</i>
                      <span className={styles.name}>{appchain_name}</span>
                    </Col>
                    <Col span={5}>{validators.length}</Col>
                    <Col span={4}>{totalStaked} OCT</Col>
                    <Col span={4}>
                      <Row justify="end">
                        <span className={`${styles.status} ${styles[status]}`}>
                          {status}
                        </span>
                      </Row>
                    </Col>
                  </Row>
                );
              })
            ) : (
              <div>No data</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default React.memo(Home);
