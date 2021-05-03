import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';

import { message, Table, Row, Pagination } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';

import { Link, useNavigate } from 'react-router-dom';
import { CopyToClipboard } from 'react-copy-to-clipboard';

function getHeaderByBlockNumber(api, num) {
  
  return api.rpc.chain.getBlockHash(num)
    .then(hash => Promise.all([
      api.rpc.chain.getBlock(hash),
      api.derive.chain.getHeader(hash)
    ])).then(([getBlock, header]) => {
      const json = header.toJSON();
      return {
        key: json.number,
        hash: header.hash.toString(),
        extrincs: getBlock.block.extrinsics,
        ...json
      }
    });
}

function BlockTable({ api, bestNumber, appchainId }): React.ReactElement {

  const navigate = useNavigate();

  const [currPage, setCurrPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [pageData, setPageData] = useState<any[]>([]);

  const isMounted = useRef(false);

  const [isTableLoading, setIsTableLoading] = useState(false);
  const [isTablePause, setIsTablePause] = useState(false);

  useEffect((): () => void => {
    isMounted.current = true;
    return (): void => {
      isMounted.current = false;
    };
  }, []);

  const columns = useMemo(() => {
    return [
      {
        title: 'Block',
        dataIndex: 'number',
        key: 'number',
        render: (text) => {
          return (
            <span style={{ fontWeight: 600, fontSize: '15px', color: '#53ab90' }}>#{text}</span>
          );
        }
      },
      {
        title: 'Hash',
        dataIndex: 'hash',
        key: 'hash',
        render: (text) => {
          return (
            <span>
              {text.substr(0, 18)}...{text.slice(-18)}
            </span>
          );
        }
      },
      {
        title: 'Extrinsics',
        key: 'extrincs',
        width: '300px',
        render: (_, record) => {
          const { extrincs } = record;
          const tags = extrincs.map((extrinc, idx) => {
            const { method, section } = extrinc.registry.findMetaCall(extrinc.callIndex);
            return <span style={{ 
              color: '#74ade7', fontSize: '12px', marginBottom: '5px',
              padding: '5px', borderRadius: '3px', marginLeft: '5px', whiteSpace: 'nowrap' 
            }} key={idx}>{section}.{method}()</span>
            // return <Link to={`/appchain/${appchainId}/extrinsic/${record.number}-${idx}`} key={extrinc.hash.toHex()}>
            //   <span style={{ 
            //     color: '#74ade7', background: '#f5f5fc', fontSize: '12px',
            //     padding: '5px', borderRadius: '3px', marginLeft: '5px' 
            //   }}>{section}.{method}()</span>
            //   </Link>
          });
          return <div style={{ textAlign: 'right', maxWidth: '300px' }}>{tags}</div>
        }
      }
    ];
  }, [bestNumber]);

  useEffect(
    () => {
      if (bestNumber < 1 || isTablePause) return;

      setTotal(bestNumber);

      let blockStart = bestNumber - pageSize * (currPage - 1);
      let blockEnd = bestNumber - pageSize * currPage + 1;
      blockEnd = blockEnd < 1 ? 1 : blockEnd;
      
      const promises = [];
      for (let i = blockStart; i >= blockEnd; i--) {
        promises.push(getHeaderByBlockNumber(api, i));
      }
      
      Promise.all(promises).then(headers => {
        if (isMounted.current) {
          setPageData(headers);
          isTableLoading && setIsTableLoading(false);
        }
      }).catch(err => {
        message.error(err.toString());
        if (isMounted.current) {
          isTableLoading && setIsTableLoading(false);
        }
      });
    }, 
    [bestNumber, pageSize, currPage, isTableLoading, isTablePause]
  );

  const pagination = useMemo(() => {
    return {
      current: currPage,
      pageSize,
      total,
      onChange: (page) => {
        setIsTableLoading(true);
        setCurrPage(page);
      },
      onShowSizeChange: (size) => setPageSize(size),
      showSizeChanger: false
    }
  }, [total, pageSize, currPage]);

  const onTablePause = useCallback(() => {
    setIsTablePause(true);
  }, []);

  const onTablePlay = useCallback(() => {
    setIsTablePause(false);
  }, []);

  return (
    <div>
      <div onMouseEnter={onTablePause} onMouseLeave={onTablePlay}>
        <Table pagination={false} loading={isTableLoading || (total > 0 && pageData.length <= 0) } 
          className={pageData.length > 0 ? 'fresh-table' : ''} columns={columns} 
          dataSource={pageData} rowKey={(record) => record.hash} />
      </div>
      {
        total > pageSize && pageData.length > 0 &&
        <Row justify='center' style={{marginTop: '30px' }}>
          <Pagination {...pagination} />
        </Row>
      }
    </div>
  );
} 

export default React.memo(BlockTable);