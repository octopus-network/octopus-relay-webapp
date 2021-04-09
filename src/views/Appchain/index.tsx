import React, { useState, useEffect, useCallback } from "react";

import { utils } from 'near-api-js';
import { useParams } from 'react-router-dom';
import { Card, Descriptions, message, Table, Button } from "antd";
import { LeftOutlined, RightOutlined, SelectOutlined, CopyOutlined } from "@ant-design/icons";

import { CopyToClipboard } from 'react-copy-to-clipboard';
import TokenBadge from "../../components/TokenBadge";
import Status from "../../components/Status";

function Appchain(): React.ReactElement {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const [appchain, setAppchain] = useState<any>();

  const [isLoadingValidators, setIsLoadingValidators] = useState<boolean>(false);
  const [currValidatorSetIdx, setCurrValidatorSetIdx] = useState<number>(0);
  const [appchainValidatorIdex, setAppchainValidatorIdx] = useState<number>(0);
  const [validatorSet, setValidatorSet] = useState<any>();

  const columns = [
    {
      title: "Account",
      dataIndex: "account_id",
      render: (text) => {
        return (
          <a href={`https://explorer.testnet.near.org/accounts/${text}`}>
            <span style={{ position: "absolute", transform: "rotate(90deg)" }}><SelectOutlined /></span>
            <span style={{ marginLeft: "20px" }}>{text}</span>
          </a>
        );
      }
    },
    {
      title: "Appchain Validator Id",
      dataIndex: "id",
      key: "id",
      render: (text) => {
        return (
          <CopyToClipboard text={text} onCopy={() => message.info('Validator Id Copied!')}>
          <div style={{ cursor: "pointer" }}>
            <span>{text.substr(0,10)}...{text.substr(-10)}</span>
            <span style={{ marginLeft: "5px", color: "#aaa" }}><CopyOutlined /></span>
          </div>
          </CopyToClipboard>
        );
      }
    },
    {
      title: "Weight",
      dataIndex: "weight",
      render: (value) => {
        return (
          <span>{value}</span>
        );
      }
    },
    {
      title: "Block Height",
      dataIndex: "block_height",
      render: (text) => {
        return <a onClick={() => gotoBlock(text)}>#{text}</a>
      }
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
      window.contract.get_curr_validator_set_index({ appchain_id: appchainId })
    ]).then(([appchain, idx]) => {
      console.log(appchain);
      setIsLoading(false);
      setAppchain(appchain);
      setCurrValidatorSetIdx(idx);
      setAppchainValidatorIdx(idx);
      // getValidators(appchainId, idx);
    });
  }, [id]);

  const getValidators = function(idx) {
   
    setIsLoadingValidators(true);
    window.contract.get_validator_set({ appchain_id: appchain.id, seq_num: idx })
      .then(set => {
        setIsLoadingValidators(false);
        setValidatorSet(set);
      })
      .catch(err => {
        setIsLoadingValidators(false);
        message.error(err.toString());
      });
  }

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

  const gotoBlock = function(blockId) {
    utils.web.fetchJson(window.walletConnection._near?.config.nodeUrl, JSON.stringify({
      "jsonrpc": "2.0",
      "id": "dontcare",
      "method": "block", 
      "params": {
          "block_id": blockId
      }
    })).then(({ result }) => {
      window.location.href = `https://explorer.testnet.near.org/blocks/${result.header.hash}`;
    });
  }

  return (
    <div>
      <Card loading={isLoading} title="Detail" bordered={false}>
        {
          appchain !== undefined &&
          <Descriptions column={2}>
            <Descriptions.Item label="Appchain Id">{id}</Descriptions.Item>
            <Descriptions.Item label="Block Height">
              <a onClick={() => gotoBlock(appchain.block_height)}>#{appchain.block_height}</a>
            </Descriptions.Item>
            <Descriptions.Item label="Appchain Name">{appchain.appchain_name}</Descriptions.Item>
            <Descriptions.Item label="Founder">{appchain.founder_id}</Descriptions.Item>
            <Descriptions.Item label="Chain Spec">
              {
                appchain.chain_spec_url ? 
                <a href={appchain.chain_spec_url} target="_blank" >Download</a> :
                <span></span>
              }
            </Descriptions.Item>
            <Descriptions.Item label="Chain Spec Hash">
              {
                appchain.chain_spec_hash ?
                <span>{appchain.chain_spec_hash} (SHA256)</span> :
                <span></span>
              }
            </Descriptions.Item>
            <Descriptions.Item label="Bond Tokens">{appchain.bond_tokens} <TokenBadge /></Descriptions.Item>
            <Descriptions.Item label="Status"><Status type={appchain.status} /></Descriptions.Item>
          </Descriptions>
        }
      </Card>
      <div style={{marginTop: "15px"}}>
        <Card title={<span>Validators 
          <Button type="text" disabled={currValidatorSetIdx <= 0} size="small" icon={<LeftOutlined />} onClick={onPrevIndex} /> 
            Index: {currValidatorSetIdx} <Button size="small" type="text" onClick={onNextIndex} disabled={currValidatorSetIdx >= appchainValidatorIdex} 
            icon={<RightOutlined />} /></span>} 
          bordered={false} loading={isLoading || isLoadingValidators}>
          <Table columns={columns} rowKey={record => record.id} dataSource={validatorSet?.validators} pagination={false} />
        </Card>
      </div>
    </div>
  );
}

export default React.memo(Appchain);