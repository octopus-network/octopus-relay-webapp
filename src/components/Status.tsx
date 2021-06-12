import React from "react";
import { Tag } from "antd";

function Status({ type }) {
  const type2color = {
    "Staging": "#ddd",
    "Booting": "#87d068",
    "Broken": "#f50"
  }

  return (
    <Tag color={type2color[type] || "#ddd"}>{ type }</Tag>
  );
}

export default Status;