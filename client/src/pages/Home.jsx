/* ================================================================== */
/* === 2 | client/src/pages/Home.jsx (FULL NEW LAYOUT) ============== */
/* ================================================================== */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios   from "axios";
import { Button, Card, Col, Modal, Row, Space, message, Typography } from "antd";

const { Title } = Typography;

// Point to Express backend instead of React’s dev server
const API_BASE = "http://localhost:5100/api/projects";

function Home() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [creating, setCreating] = useState(false);
  const [newName,  setNewName]  = useState("");

  const load = async () => {
    try {
      const res = await axios.get(`${API_BASE}`);
      setProjects(res.data.projects);
    } catch {
      message.error("Failed to load projects");
    }
  };

  useEffect(() => { load(); }, []);

  /* ---------- create ---------- */
  const create = async () => {
    if (!newName.trim()) return;
    try {
      await axios.post(`${API_BASE}`, { name: newName.trim() });
      message.success("Project created");
      setNewName("");
      setCreating(false);
      load();
    } catch (e) {
      message.error(e.response?.data?.error || "Create failed");
    }
  };

  /* ---------- delete ---------- */
  const del = name => {
    Modal.confirm({
      title: `Delete "${name}"?`,
      content: "This removes the folder and all its files. This cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await axios.delete(`${API_BASE}/${encodeURIComponent(name)}`);
          message.success("Deleted");
          load();
        } catch {
          message.error("Delete failed");
        }
      }
    });
  };

  return (
    <div style={{ maxWidth: 1000, margin: "2rem auto" }}>
      <Title level={2}>SplitStack Projects</Title>

      <Space style={{ marginBottom: 24 }}>
        <Button type="primary" onClick={() => setCreating(true)}>+ New Project</Button>
      </Space>

      <Row gutter={[16, 16]}>
        {projects.map(p => (
          <Col key={p} xs={24} sm={12} md={8}>
            <Card
              title={p}
              size="small"
              actions={[
                <Button type="link" onClick={() => navigate(`/project/${encodeURIComponent(p)}`)}>
                  Open
                </Button>,
                <Button danger type="link" onClick={() => del(p)}>
                  Delete
                </Button>
              ]}
            />
          </Col>
        ))}
      </Row>

      <Modal
        open={creating}
        onCancel={() => setCreating(false)}
        onOk={create}
        okText="Create"
        title="New Project"
      >
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          style={{ width: "100%", padding: 8 }}
          placeholder="Project name"
          onKeyDown={e => e.key === "Enter" && create()}
        />
      </Modal>
    </div>
  );
}

export default Home;