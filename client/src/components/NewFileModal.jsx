/* =================================================================== */
/* === client/src/components/NewFileModal.jsx ======================== */
/* =================================================================== */
import React, { useMemo, useState } from "react";
import { Modal, Input, Select } from "antd";

function NewFileModal({ visible, onCreate, onCancel, existingDirs }) {
  const [path, setPath] = useState("");

  const dirOptions = useMemo(
    () => existingDirs.map(d => ({ value: d, label: d || "/" })),
    [existingDirs]
  );

  const handleOk = () => {
    if (!path.trim()) return;
    onCreate(path.trim());
    setPath("");
  };

  return (
    <Modal
      open={visible}
      title="Create a new file"
      onOk={handleOk}
      onCancel={() => {
        setPath("");
        onCancel();
      }}
      okText="Create"
    >
      <p>Directory:</p>
      <Select
        defaultValue=""
        options={dirOptions}
        style={{ width: "100%", marginBottom: "0.5rem" }}
        onChange={dir => setPath(dir ? `${dir}/` : "")}
      />
      <p>File name (with extension):</p>
      <Input
        placeholder="e.g. index.js or utils/helpers.js"
        value={path}
        onChange={e => setPath(e.target.value)}
        onPressEnter={handleOk}
      />
    </Modal>
  );
}

export default NewFileModal;