import { api } from "../api/axios";

export const folderApi = {
  getAll: () => api.get("/folders"),
  
  create: (name: string) => api.post("/folders", { name }),
  
  rename: (id: string, name: string) => api.patch(`/folders/${id}`, { name }),
  
  delete: (id: string) => api.delete(`/folders/${id}`),
  
  assignToLead: (leadId: string, folderId: string | null) =>
    api.patch(`/leads/${leadId}/folder`, { folder_id: folderId }),
};