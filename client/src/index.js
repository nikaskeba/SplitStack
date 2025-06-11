import "monaco-editor/min/vs/editor/editor.main.css";   // load editor styles FIRST
import React from "react";
import "antd/dist/reset.css";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);