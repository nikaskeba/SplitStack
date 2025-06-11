/* =================================================================== */
/* === 1 | client/src/components/VerticalTabBar.jsx (NEW) ============ */
/* =================================================================== */
import React from "react";
import { FileOutlined, CloseOutlined } from "@ant-design/icons";

function VerticalTabBar({ files, active, setActive, onClose, onNewFile }) {
  return (
    <div style={{
      width: 160,
      borderRight: "1px solid #aaa",
      overflowY: "auto"
    }}>
      {files.map(f => (
        <div
          key={f.path}
          onClick={() => setActive(f.path)}
          style={{
            padding: "4px 8px",
            cursor: "pointer",
            background: active === f.path ? "#e6f4ff" : "transparent",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: 4
          }}
        >
          <FileOutlined />
          <span style={{ flex: 1, textOverflow: "ellipsis", overflow: "hidden" }}>
            {f.path.split("/").pop()}
          </span>
          {files.length > 1 && (
            <CloseOutlined
              onClick={e => (e.stopPropagation(), onClose(f.path))}
              style={{ fontSize: 10 }}
            />
          )}
        </div>
      ))}
      {/* plus button */}
      <div
        onClick={onNewFile}
        style={{
          padding: "4px 8px",
          cursor: "pointer",
          color: "#1677ff"
        }}
      >
        + New File
      </div>
    </div>
  );
}
export default VerticalTabBar;
