// client/src/components/FileTree.jsx
import React from "react";
import { Tree, Modal, Input, message } from "antd";
import {
  FolderOpenOutlined,
  FolderOutlined,
  FileOutlined,
  DeleteOutlined
} from "@ant-design/icons";

function buildTreeData(paths, onDeleteFile) {
  const root = {};
  paths.forEach(p => {
    const parts = p.split("/");
    let node = root;
    parts.forEach((part, idx) => {
      if (!node[part]) node[part] = idx === parts.length - 1 ? null : {};
      node = node[part] || {};
    });
  });

  const toAntd = (obj, parent = "") =>
    Object.entries(obj).map(([name, child]) => {
      const key = parent ? `${parent}/${name}` : name;

      if (child) {
        // folder node (still use icon prop here)
        return {
          title: name,
          key,
          icon: <FolderOutlined />,
          children: toAntd(child, key),
          isLeaf: false
        };
      } else {
        // leaf (file) node: put FileOutlined, filename, and DeleteOutlined in one flex container
        return {
          title: (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%"
              }}
            >
              {/* left side: file icon + name */}
              <div style={{ display: "flex", alignItems: "center" }}>
                <FileOutlined style={{ marginRight: 4 }} />
                <span>{name}</span>
              </div>

              {/* right side: delete icon */}
              <DeleteOutlined
                onClick={e => {
                  e.stopPropagation();
                  onDeleteFile(key);
                }}
                style={{ color: "#ff4d4f" }}
              />
            </div>
          ),
          key,
          // no `icon` prop for leaf—everything is inside title now
          isLeaf: true
        };
      }
    });

  return toAntd(root);
}

function FileTree({
  projects,
  currentProject,
  files,
  onSelectFile,
  onSwitchProject,
  onAddDir,
  onDeleteFile
}) {
  const rootNodes = projects.map(p => ({
    title: p,
    key: p,
    icon: p === currentProject ? <FolderOpenOutlined /> : <FolderOutlined />,
    children: p === currentProject ? buildTreeData(files, onDeleteFile) : [],
    isLeaf: false
  }));

  const handleSelect = ([key], { node }) => {
    if (!key) return;
    if (projects.includes(key)) {
      if (key !== currentProject) onSwitchProject(key);
    } else {
      if (node.isLeaf) onSelectFile(key);
    }
  };

  const handleRightClick = ({ node }) => {
    if (node.isLeaf) return;
    Modal.confirm({
      title: "New folder inside " + node.key,
      content: <Input id="newDirInput" placeholder="folder-name" />,
      okText: "Create",
      onOk: () => {
        const name = document.getElementById("newDirInput").value.trim();
        if (!name) return;
        const newPath = `${node.key}/${name}`;
        onAddDir(newPath);
        message.success("Folder added (save to persist)");
      }
    });
  };

  return (
    <Tree
      showIcon
      defaultExpandAll
      treeData={rootNodes}
      onSelect={handleSelect}
      onRightClick={handleRightClick}
      style={{ width: 220, overflowY: "auto", borderRight: "1px solid #aaa" }}
    />
  );
}

export default FileTree;