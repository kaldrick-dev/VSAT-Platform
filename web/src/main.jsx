import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "maplibre-gl/dist/maplibre-gl.css";
import "./tailwind.css";
import { App } from "./App.jsx";
import { AuthProvider } from "./hooks/useAuth.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
