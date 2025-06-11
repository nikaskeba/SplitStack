/* ================================================================= */
/*  client/src/components/TabBar.jsx                                 */
/* ================================================================= */
import React from "react";

function TabBar({ sections, active, setActive, onAdd, onClose }) {
  // keep only real file paths in `fileSections`
  const fileSections = sections.filter((p) => p);

  // final order: Tree • Master • files…
  const tabs = ["__TREE__", "", ...fileSections];

  return (
    <div
      style={{
        display: "flex",
        background: "#f5f5f5",
        borderBottom: "1px solid #d9d9d9",
        overflowX: "auto",
      }}
    >
      {tabs.map((p) => {
        const isTree   = p === "__TREE__";
        const isMaster = p === "";

        const label = isTree ? "Tree" : isMaster ? "Master" : p.split("/").pop();

        return (
          <div
            key={isMaster ? "__MASTER__" : p}
            onClick={() => setActive(p)}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "4px 12px",
              cursor: "pointer",
              background: active === p ? "#fff" : "transparent",
              borderRight: "1px solid #d9d9d9",
              maxWidth: 200,
              fontStyle: isTree ? "italic" : "normal",
              userSelect: "none",
            }}
            title={isTree ? "Project folder tree" : p || "master.txt"}
          >
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </span>

            {/* close × only for real file tabs */}
            {!isTree && !isMaster && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onClose(p);
                }}
                style={{
                  fontSize: 10,
                  marginLeft: 8,
                  cursor: "pointer",
                  color: "#999",
                }}
              >
                ×
              </span>
            )}
          </div>
        );
      })}

      {/* ＋ add‑file button */}
      <div
        onClick={onAdd}
        style={{
          padding: "4px 12px",
          cursor: "pointer",
          color: "#1677ff",
          userSelect: "none",
        }}
        title="New file section"
      >
        ＋
      </div>
    </div>
  );
}

export default TabBar;