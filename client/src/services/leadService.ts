import { api } from "@/api/axios";

export interface Lead {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  job_title?: string;
  job_department?: string;
  job_level?: string;
  company_size?: string;
  revenue_range?: string;
  city?: string;
  country?: string;
  status?: "newLeads" | "potential" | "contacted";
  folder_id?: string | null;
  lead_folders?: { id: string; name: string } | null;
  file_count?: number;
  created_at?: string;
}

export const leadService = {
  async getAll(): Promise<Lead[]> {
    const res = await api.get("/leads");
    return res.data.data;
  },

  async create(data: Partial<Lead>): Promise<Lead> {
    const res = await api.post("/leads", data);
    return res.data.data;
  },

  async update(id: string, data: Partial<Lead>): Promise<Lead> {
    const res = await api.patch(`/leads/${id}`, data);
    return res.data.data;
  },

  async updateStatus(id: string, status: Lead["status"]): Promise<Lead> {
    const res = await api.patch(`/leads/${id}/status`, { status });
    return res.data.data;
  },

  async assignFolder(id: string, folderId: string | null): Promise<Lead> {
    const res = await api.patch(`/leads/${id}/folder`, { folder_id: folderId });
    return res.data.data;
  },

  async getFiles(leadId: string): Promise<any[]> {
    const res = await api.get(`/lead-files/${leadId}`);
    return res.data.data;
  },

  async getAllFiles(): Promise<any[]> {
    const res = await api.get("/lead-files");
    return res.data.data;
  },

  async uploadFile(leadId: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("lead_id", leadId);
    const res = await api.post("/lead-files", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
  },

  async deleteFile(fileId: string): Promise<void> {
    await api.delete(`/lead-files/${fileId}`);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/leads/${id}`);
  },

  async enrichLead(id: string, company_name: string): Promise<any> {
    const res = await api.post(`/leads/${id}/enrich`, { company_name });
    return res.data.data;
  },
};