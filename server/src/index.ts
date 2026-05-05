// src/server.ts  — full file
import "dotenv/config"; 
import http from "http";
import { WebSocketServer } from "ws";
import app, { initStorage } from "./app";
import { env } from "./config/env";
import { setWss } from "./lib/websocket";
import { startCallScheduler } from "./services/callScheduler";


const PORT = parseInt(env.PORT, 10);

// ── create a plain http server wrapping express ───────────────────────────────
// This lets WebSocket and HTTP share the same port
const httpServer = http.createServer(app);


// ── attach WebSocket server to the same http server ───────────────────────────
const wss = new WebSocketServer({
  server: httpServer,
  path: "/ws",              // React connects to ws://host/ws
});

startCallScheduler(wss);

wss.on("connection", (socket, req) => {
  console.log("[ws] client connected:", req.socket.remoteAddress);

  socket.on("close", () => {
    console.log("[ws] client disconnected");
  });

  socket.on("error", (err) => {
    console.error("[ws] socket error:", err.message);
  });

  // send a heartbeat every 30s to keep the connection alive
  const ping = setInterval(() => {
    if (socket.readyState === socket.OPEN) socket.ping();
  }, 30_000);

  socket.on("close", () => clearInterval(ping));
});

// ── give the controller access to the wss instance ───────────────────────────
setWss(wss);

// ── start everything ─────────────────────────────────────────────────────────
httpServer.listen(PORT, async () => {
  await initStorage();
  console.log(`[server] HTTP + WS running on port ${PORT}`);
});

// ── graceful shutdown ─────────────────────────────────────────────────────────
const shutdown = () => {
  console.log("[server] shutting down...");
  wss.close(() => {
    httpServer.close(() => {
      console.log("[server] closed");
      process.exit(0);
    });
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);