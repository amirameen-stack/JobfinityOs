// src/services/schedulerService.ts
import { api } from "@/api/axios";

export interface CallReport {
  id: string;
  lead_id: string;
  twilio_sid: string;
  status: string;
  outcome: string;
  duration: number | null;
  transcript: { role: string; text: string; timestamp: string }[];
  created_at: string;
  leads?: {
    company_name: string;
    contact_name: string;
    phone: string;
  };
}

export const schedulerService = {
  async getTodaysCalls(): Promise<CallReport[]> {
    const res = await api.get("/calls/today");
    return res.data.data;
  },

  async getAllCalls(): Promise<CallReport[]> {
    const res = await api.get("/calls");
    return res.data.data;
  },
};