import React, { useCallback, useEffect, useState } from 'react';

import { Button, Modal, Form, Select, Input, message, Result } from 'antd';
import { UserOutlined } from '@ant-design/icons';

import { isWeb3Injected, web3FromSource, web3Enable, web3Accounts } from '@polkadot/extension-dapp';

const argIsOptional = (arg) =>
  arg.type.toString().startsWith('Option<');

function RPCModal({ api, visible, onCancel, onOk }): React.ReactElement {
  const [palletRPCs, setPalletPRCs] = useState([]);
  const [palletRPC, setPalletRPC] = useState('');
  const [callables, setCallables] = useState([]);
  const [callable, setCallable] = useState('');

  const [account, setAccount] = useState({ address: '', source: '' });
  const [accountBalance, setAccountBalance] = useState('0');
 
  const [unsub, setUnsub] = useState<any>();
  const [submiting, setSubmiting] = useState(false);

  const [inputParams, setInputPrams] = useState([]);
  const [paramFields, setParamFields] = useState([]);

  const [appchainAccounts, setAppchainAccounts] = useState([]);

  useEffect(() => {
    if (!visible) {
      setAccount({ address: '', source: '' });
      setPalletRPC('');
      setCallable('');
    }
    if (visible) {
      web3Enable('Octopus').then(res => {
        web3Accounts().then(accounts => {
          setAppchainAccounts(accounts);
        });
      });
    }
  }, [visible]);

  useEffect(() => {
    if (!api) return;
    const palletRPCs = Object.keys(api.tx).sort().map(k => ({ label: k, value: k }));
  
    setPalletPRCs(palletRPCs);
  }, [api]);

  useEffect(() => {
    if (!api || !palletRPCs || !palletRPC) return;
    const callables = Object.keys(api.tx[palletRPC]).sort().map(k => ({ label: k, value: k }));
    setCallables(callables);
  }, [api, palletRPCs, palletRPC]);

  useEffect(() => {
    if (!api || palletRPC === '' || callable === '') {
      return setParamFields([]);
    }

    let paramFields = [];

    const metaArgs = api.tx[palletRPC][callable].meta.args;

    if (metaArgs && metaArgs.length > 0) {
      paramFields = metaArgs.map(arg => ({
        name: arg.name.toString(),
        type: arg.type.toString(),
        optional: argIsOptional(arg)
      }));
    }

    setParamFields(paramFields);

  }, [api, palletRPC, callable]);

  const txResHandler = (res) => {
    setSubmiting(false);
    console.log(res);
    onOk && onOk();
  }

  const txErrHandler = (err) => {
    setSubmiting(false);
    message.error(err.toString());
  }

  const transformParams = (paramFields, inputParams, opts = { emptyAsNull: true }) => {
    // if `opts.emptyAsNull` is true, empty param value will be added to res as `null`.
    //   Otherwise, it will not be added
    const paramVal = inputParams.map(inputParam => {
      // To cater the js quirk that `null` is a type of `object`.
      if (typeof inputParam === 'object' && inputParam !== null && typeof inputParam.value === 'string') {
        return inputParam.value.trim();
      } else if (typeof inputParam === 'string') {
        return inputParam.trim();
      }
      return inputParam;
    });
    const params = paramFields.map((field, ind) => ({ ...field, value: paramVal[ind] || null }));

    return params.reduce((memo, { type = 'string', value }) => {
      if (value == null || value === '') return (opts.emptyAsNull ? [...memo, null] : memo);

      let converted = value;

      // Deal with a vector
      if (type.indexOf('Vec<') >= 0) {
        converted = converted.split(',').map(e => e.trim());
        converted = converted.map(single => isNumType(type)
          ? (single.indexOf('.') >= 0 ? Number.parseFloat(single) : Number.parseInt(single))
          : single
        );
        return [...memo, converted];
      }

      // Deal with a single value
      if (isNumType(type)) {
        converted = converted.indexOf('.') >= 0 ? Number.parseFloat(converted) : Number.parseInt(converted);
      }
      return [...memo, converted];
    }, []);
  };

  const isNumType = type => {
    return [
      'Compact<Balance>',
      'BalanceOf',
      'u8', 'u16', 'u32', 'u64', 'u128',
      'i8', 'i16', 'i32', 'i64', 'i128'
    ].some(el => type.indexOf(el) >= 0);
  }

  const signedTx = async () => {
    setSubmiting(true);
    const injected = await web3FromSource(account.source);
    api.setSigner(injected.signer);

    const transformed = transformParams(paramFields, inputParams);
    // transformed can be empty parameters

    let txExecute;
    try {
      txExecute = transformed
        ? api.tx[palletRPC][callable](...transformed)
        : api.tx[palletRPC][callable]();
    } catch(err) {
      console.log(err);
      setSubmiting(false);
      return message.error(err.toString());
    }

    const unsub = await txExecute.signAndSend(account.address, txResHandler)
      .catch(txErrHandler);

    setSubmiting(false);

    setUnsub(() => unsub);
  }

  const transaction = async () => {
    if (unsub) {
      unsub();
      setUnsub(null);
    }
    signedTx();
  }

  const onPalletCallableParamChange = (t, v) => {

    setInputPrams((params) => {
      const inputParams = [...params];
      inputParams.push({ type: t, value: v });
      return inputParams;
    });

  }

  const onChangeAccount = (v) => {
    const tmpArr = v.split('|');
    setAccount({ address: tmpArr[0], source: tmpArr[1] });

  }

  useEffect(() => {
    if (!account.address) return;
    let unsubscribe;
    api
      .query.system.account(account.address, balance => {
        setAccountBalance(balance.data.free.toHuman());
      })
      .then(unsub => {
        unsubscribe = unsub;
      })
      .catch(console.error);
    
    return () => unsubscribe && unsubscribe();
  }, [api, account]);
  
  return (
    <Modal visible={visible} title='RPC Call' onCancel={onCancel} destroyOnClose={true} footer={null}>
      {
        isWeb3Injected ?
        appchainAccounts.length ?
        <Form>
          <Form.Item>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ 
                display: 'block', width: '36px', height: '36px', marginRight: '15px', 
                borderRadius: '50%', background: '#eee', textAlign: 'center', lineHeight: '36px'
              }}>
                <UserOutlined style={{ margin: 0 }} /> 
              </span>
              <div style={{ flex: '1' }}>
                <Select size='large' placeholder='Choose an account' onChange={v => onChangeAccount(v)}>
                  {
                    appchainAccounts.map((account, idx) => {
                      const { address, meta } = account;
                      return (
                        <Select.Option value={address + '|' + meta.source} key={idx}>{meta.name} ({meta.source})</Select.Option>
                      );
                    })
                  }
                </Select>
              </div>
              {
                account.address &&
                <span style={{ marginLeft: '10px', background: '#eee', padding: '5px', borderRadius: '5px' }}>{ accountBalance } </span>
              }
            </div>
          </Form.Item>
          <Form.Item>
            <Select options={palletRPCs} placeholder={'Palles/RPC'} size='large' onChange={v => {
              setPalletRPC(v as string);
              setCallable('');
            }} />
          </Form.Item>
          <Form.Item>
            <Select options={callables} placeholder={'Callables'} size='large' onChange={v => setCallable(v as string)} />
          </Form.Item>
          {
            paramFields.length > 0 &&
            <Form.Item>
              {
                paramFields.map(({ name, type }, idx) => (
                  <div key={idx} style={{ marginBottom: '10px' }}>
                    <Input addonBefore={<span>{name}</span>} placeholder={type} 
                      onChange={e => onPalletCallableParamChange(type, e.target.value)} />
                  </div>
                ))
              }
            </Form.Item>
          }
          <Form.Item>
            <Button type='primary' disabled={!callable || !account.address} style={{ width: '100%' }} 
              loading={submiting} size='large' onClick={transaction}>Submit</Button>
          </Form.Item>
        </Form> :
        <Result title='No accounts found' subTitle='please import account via extension' /> : 
        <Result title='No extension found' subTitle='please install Polkadot{.js} or Mathwallet first' />
       
      }
      
    </Modal>
  );
}

export default React.memo(RPCModal);

