import React, { useState } from "react";
import axios from "axios";

function ProjectSelectorModal({ onClose, onCreated }) {
  const [name, setName] = useState("");

  const createProject = async () => {
    if (!name.trim()) return;
    await axios.post("/api/projects", { name });
    onCreated(name.trim());
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{ background: "#fff", padding: "2rem", minWidth: "300px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>New Project</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Project name"
          style={{ width: "100%", marginBottom: "1rem" }}
        />
        <button onClick={createProject} style={{ marginRight: "0.5rem" }}>
          Create
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

export default ProjectSelectorModal;
