// src/services/callService.ts
import { api } from "../api/axios";

export interface CallLog {
  id: string;
  lead_id: string;
  twilio_sid: string;
  status: string;
  duration: number | null;
  transcript: { role: string; text: string; timestamp: string }[];
  created_at: string;
  leads?: {
    id: string;
    company_name: string;
    contact_name: string;
  };
}

export const callService = {
  async start(leadId: string, toNumber: string) {
    const res = await api.post("/calls/start", {
      lead_id:   leadId,
      to_number: toNumber,
    });
    return res.data;
  },

  async getByLead(leadId: string): Promise<CallLog[]> {
    const res = await api.get(`/calls/lead/${leadId}`);
    return res.data.data;
  },

  async getAll(): Promise<CallLog[]> {
    const res = await api.get("/calls");
    return res.data.data;
  },
};