import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import { AuthProvider } from "@/context/AuthProvider";
import { Toaster } from "react-hot-toast";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
      <Toaster 
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#10213E",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.1)",
          },
        }}
      />

    </AuthProvider>
  </React.StrictMode>
);