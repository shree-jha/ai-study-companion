import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import Login from "./Login";
import "./index.css";

function Root() {
  const token = localStorage.getItem("token");

  return token ? <App /> : <Login />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);