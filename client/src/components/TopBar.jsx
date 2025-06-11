/* ================================================================== */
/* === client/src/components/TopBar.jsx  (REPLACE) ================== */
/* ================================================================== */
import React from "react";
import { Button, Tooltip } from "antd";
import {
  CodeOutlined,
  FolderOutlined,
  SaveOutlined,
  AppstoreOutlined
} from "@ant-design/icons";

function TopBar({ mode, setMode, onSave, onBack }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "6px 12px",
        background: "#1f1f1f",
        color: "#fff",
        gap: 10
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <CodeOutlined />
        <span style={{ fontWeight: 600 }}>Split Coder</span>
      </div>

      <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
        <Button icon={<FolderOutlined />} onClick={onBack}>
          Projects
        </Button>

        <Tooltip title="Save master and split into files">
          <Button type="primary" icon={<SaveOutlined />} onClick={onSave}>
            Save
          </Button>
        </Tooltip>

        <Button
          icon={<AppstoreOutlined />}
          onClick={() => setMode(m => (m === "single" ? "tabs" : "single"))}
        >
          {mode === "single" ? "Tabs" : "Master"}
        </Button>
      </div>
    </div>
  );
}
export default TopBar;
