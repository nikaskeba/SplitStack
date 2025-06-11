/* ================================================================= */
/*  client/src/components/TabBar.jsx                                 */
/* ================================================================= */
import React from "react";

/**
 * @param {string[]} sections   array of file‑paths in master.txt
 * @param {string}   active     currently‑selected path ('' = Master view)
 * @param {fn}       setActive  select a tab
 * @param {fn}       onAdd      create a brand‑new file
 * @param {fn}       onClose    remove a section from the bar / master.txt
 */
function TabBar({ sections, active, setActive, onAdd, onClose }) {
  return (
    <div
      style={{
        display: "flex",
        background: "#f5f5f5",
        borderBottom: "1px solid #d9d9d9",
        overflowX: "auto",
      }}
    >
      {sections.map((p) => (
        <div
          key={p}
          onClick={() => setActive(p)}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "4px 12px",
            cursor: "pointer",
            background: active === p ? "#fff" : "transparent",
            borderRight: "1px solid #d9d9d9",
            maxWidth: 180,
          }}
        >
          {/* filename */}
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {p.split("/").pop() || "Master"}
          </span>

          {/* close × */}
          {p && (
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
      ))}

      {/* ＋ add‑file button */}
      <div
        onClick={onAdd}
        style={{
          padding: "4px 12px",
          cursor: "pointer",
          color: "#1677ff",
          userSelect: "none",
        }}
      >
        ＋
      </div>
    </div>
  );
}

export default TabBar;