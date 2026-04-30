import { supabase, supabaseAdmin } from "../config/supabase";
import { AppError } from "../middleware/error.middleware";

export const LeadFileModel = {
  async createFile(data: {
    name: string;
    path: string;
    url: string;
    lead_id: string;
    user_id: string;
  }) {
    const { data: result, error } = await supabaseAdmin
      .from("lead_files")
      .insert([data])
      .select()
      .single();

    if (error) throw new AppError(400, error.message);
    return result;
  },

  async getFilesByLead(leadId: string, userId: string) {
    const { data: files, error: fileError } = await supabaseAdmin
      .from("lead_files")
      .select("*")
      .eq("lead_id", leadId)
      .eq("user_id", userId);

    if (fileError) throw new AppError(400, fileError.message);
    if (!files || files.length === 0) return [];

    // Fetch the specific lead info
    const { data: lead, error: leadError } = await supabaseAdmin
      .from("leads")
      .select("id, company_name, lead_folders(id, name)")
      .eq("id", leadId)
      .single();

    if (leadError) return files;

    return files.map(file => ({
      ...file,
      leads: lead
    }));
  },

  async deleteFile(id: string, userId: string) {
    // 1. Fetch the record to get the storage path
    const { data: file, error: fetchError } = await supabaseAdmin
      .from("lead_files")
      .select("path")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (fetchError || !file) throw new AppError(404, "File not found");

    // 2. Remove from Supabase Storage
    const { error: storageError } = await supabaseAdmin.storage
      .from("lead-files")
      .remove([file.path]);

    if (storageError) throw new AppError(500, `Storage delete failed: ${storageError.message}`);

    // 3. Remove the database record
    const { error: dbError } = await supabaseAdmin
      .from("lead_files")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (dbError) throw new AppError(400, dbError.message);
  },

  async getAllFiles(userId: string) {
    const { data: files, error: fileError } = await supabaseAdmin
      .from("lead_files")
      .select("*")
      .eq("user_id", userId);

    if (fileError) throw new AppError(400, fileError.message);
    if (!files || files.length === 0) return [];

    // Fetch associated leads with their folder info
    const leadIds = Array.from(new Set(files.map(f => f.lead_id)));
    const { data: leads, error: leadError } = await supabaseAdmin
      .from("leads")
      .select("id, company_name, lead_folders(id, name)")
      .in("id", leadIds);

    if (leadError) {
      console.warn("Failed to fetch leads for files:", leadError.message);
      return files; // Return files without lead info as fallback
    }

    const leadMap = Object.fromEntries(leads?.map(l => [l.id, l]) || []);
    
    return files.map(file => ({
      ...file,
      leads: leadMap[file.lead_id] || null
    }));
  },
};