// src/hooks/useCallAgent.ts
import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "@/api/axios";

export interface TranscriptEntry {
  role: "agent" | "prospect";
  text: string;
  timestamp: string;
}

export interface ActiveCall {
  call_id: string;
  twilio_sid: string;
  lead_id: string;
  to_number: string;
  status: string;
  duration: number | null;
}

interface WsMessage {
  type: "CALL_STARTED" | "CALL_STATUS" | "TRANSCRIPT_UPDATE" | "SCHEDULED_CALL_FIRED";
  twilio_sid?: string;
  call_id?: string;
  lead_id?: string;
  to_number?: string;
  status?: string;
  duration?: number | null;
  role?: "agent" | "prospect";
  text?: string;
  timestamp?: string;
}

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:5000/ws";

export const useCallAgent = () => {
  const [activeCall, setActiveCall]   = useState<ActiveCall | null>(null);
  const [transcript, setTranscript]   = useState<TranscriptEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isStarting, setIsStarting]   = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const wsRef          = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef     = useRef(true);

  const handleMessage = useCallback((msg: WsMessage) => {
    switch (msg.type) {
      case "CALL_STARTED":
      case "SCHEDULED_CALL_FIRED":
        setActiveCall({
          call_id:    msg.call_id ?? "", // scheduler might not have internal call_id yet
          twilio_sid: msg.twilio_sid!,
          lead_id:    msg.lead_id!,
          to_number:  msg.to_number ?? "",
          status:     "initiated",
          duration:   null,
        });
        setTranscript([]);
        break;

      case "CALL_STATUS":
        setActiveCall(prev => {
          if (prev && prev.twilio_sid === msg.twilio_sid) {
            return { ...prev, status: msg.status!, duration: msg.duration ?? null };
          }
          return prev;
        });
        if (msg.status === "completed" || msg.status === "failed") {
          setTimeout(() => {
            if (mountedRef.current) setActiveCall(null);
          }, 5000);
        }
        break;

      case "TRANSCRIPT_UPDATE":
        if (!msg.role || !msg.text) break;
        setTranscript(prev => [
          ...prev,
          {
            role:      msg.role!,
            text:      msg.text!,
            timestamp: msg.timestamp ?? new Date().toISOString(),
          },
        ]);
        break;
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setIsConnected(true);
      setError(null);
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const msg: WsMessage = JSON.parse(event.data);
        handleMessage(msg);
      } catch {
        console.error("[ws] failed to parse message:", event.data);
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setIsConnected(false);
      reconnectTimer.current = setTimeout(() => {
        if (mountedRef.current) connect();
      }, 3000);
    };

    ws.onerror = () => {
      setError("WebSocket connection error");
      ws.close();
    };
  }, [handleMessage]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const startCall = useCallback(async (leadId: string, toNumber: string) => {
    setIsStarting(true);
    setError(null);
    try {
      await api.post("/calls/start", {
        lead_id:   leadId,
        to_number: toNumber,
      });
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Failed to start call");
    } finally {
      setIsStarting(false);
    }
  }, []);

  const startAutoCalls = useCallback(async () => {
    setIsStarting(true);
    setError(null);
    try {
      await api.post("/calls/auto-start");
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Failed to start auto calls");
    } finally {
      setIsStarting(false);
    }
  }, []);

  const endCall = useCallback(async () => {
    if (!activeCall?.twilio_sid) return;
    try {
      await api.post(`/calls/${activeCall.twilio_sid}/end`);
    } catch (err) {
      console.error("[useCallAgent] endCall error:", err);
    }
  }, [activeCall]);

  return {
    activeCall,
    transcript,
    isConnected,
    isStarting,
    error,
    startCall,
    startAutoCalls,
    endCall,
  };
};