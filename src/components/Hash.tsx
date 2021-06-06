import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Tooltip } from "antd";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { CopyOutlined } from '@ant-design/icons';
import { message } from 'antd';

const StyleBlockContainer = styled(Tooltip)`
  display: flex;
  align-items: center;
`;

const StyledBlock = styled.span<{ colorHex }>`
  height: 14px;
  display: inline-block;
  width: 5px;
  background: ${({ colorHex }) => `#${colorHex}`}
`;

const Hash = ({ 
  value,
  style,
  noCopy0x = false
}: {
  value: string;
  noCopy0x?: boolean;
  style?: object;
}) => {
  if (value.substr(0,2) != '0x') {
    value = '0x' + value;
  }
  const [hashArr, setHashArr] = useState([]);
  useEffect(() => {
    const tmpArr = [];
    for (let i = 2; i < value.length -2; i+=6) {
      tmpArr.push(value.substr(i, 6));
    }
    setHashArr(tmpArr);
  }, [value]);
  return (
    <StyleBlockContainer title={value} style={style} placement="topLeft">
      <span>{value.substr(0,4)}</span>
      {hashArr.map((hex, idx) => <StyledBlock colorHex={hex} />)}
      <span>{value.substr(-2)}</span>
      <CopyToClipboard text={noCopy0x ? value.substr(2) : value} onCopy={() => message.info("Copied!")} 
        style={{ color: '#9c9c9c', padding: '5px' }}>
        <CopyOutlined />
      </CopyToClipboard>
    </StyleBlockContainer>
  );
}

export default Hash;