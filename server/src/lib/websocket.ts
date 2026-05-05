import { WebSocketServer } from "ws";

let wss: WebSocketServer | null = null;

export const setWss = (instance: WebSocketServer) => {
  wss = instance;
};

export const getWss = () => wss;

export const broadcast = (payload: object) => {
  if (!wss) return;
  const msg = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(msg);
    }
  });
};
