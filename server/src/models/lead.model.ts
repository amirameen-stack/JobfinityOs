import { supabase, supabaseAdmin } from "../config/supabase";
import { AppError } from "../middleware/error.middleware";

type LeadStatus = "newLeads" | "potential" | "contacted";

interface CreateLeadDto {
  company_name: string;
  contact_name: string;
  email: string;
  job_title?: string;
  job_department?: string;
  job_level?: string;
  company_size?: string;
  revenue_range?: string;
  city?: string;
  country?: string;
}

export const LeadModel = {
  async createLead(data: CreateLeadDto, userId: string) {
    const { data: result, error } = await supabase
      .from("leads")
      .insert([{ ...data, user_id: userId, status: "newLeads" }])
      .select()
      .single();

    if (error) throw new AppError(400, error.message);
    return result;
  },
  // Add inside LeadModel in lead.model.ts
  async assignFolder(id: string, userId: string, folderId: string | null) {
    const { data, error } = await supabase
      .from("leads")
      .update({ folder_id: folderId })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw new AppError(400, error.message);
    if (!data) throw new AppError(404, "Lead not found");
    return data;
  },

  // Also update getLeads to include folder info:
  async getLeads(userId: string) {
    const { data: leads, error: leadError } = await supabase
      .from("leads")
      .select("*, lead_folders(id, name)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (leadError) throw new AppError(500, leadError.message);

    try {
      // Fetch all file records for this user to calculate counts manually
      // This avoids the join error if the relationship is not defined in Supabase
      const { data: files } = await supabaseAdmin
        .from("lead_files")
        .select("lead_id")
        .eq("user_id", userId);

      const countMap: Record<string, number> = {};
      files?.forEach(f => {
        countMap[f.lead_id] = (countMap[f.lead_id] || 0) + 1;
      });

      return leads?.map(lead => ({
        ...lead,
        file_count: countMap[lead.id] || 0
      }));
    } catch (err) {
      // If lead_files doesn't exist or fails, return leads without counts
      return leads;
    }
  },



  async updateLead(id: string, userId: string, updates: Partial<CreateLeadDto>) {
    const { data, error } = await supabase
      .from("leads")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId) // ← row-level ownership check
      .select()
      .single();

    if (error) throw new AppError(400, error.message);
    if (!data) throw new AppError(404, "Lead not found");
    return data;
  },

  async updateStatus(id: string, userId: string, status: LeadStatus) {
    const { data, error } = await supabase
      .from("leads")
      .update({ status })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw new AppError(400, error.message);
    if (!data) throw new AppError(404, "Lead not found");
    return data;
  },

  async deleteLead(id: string, userId: string) {
    const { error } = await supabase
      .from("leads")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw new AppError(400, error.message);
  },

  // add inside LeadModel object
  async getLeadsForAutoCall(userId: string, limit: number) {
    const todayUK = new Date().toLocaleDateString("en-GB", { timeZone: "Europe/London" });

    const { data, error } = await supabaseAdmin
      .from("leads")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["newLeads", "potential"])
      .eq("auto_call_excluded", false)
      .lt("call_attempts", 3)
      .or(`last_called_at.is.null,last_called_at.lt.${new Date(todayUK).toISOString()}`)
      .order("status", { ascending: true })   // newLeads first
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) throw new AppError(500, error.message);
    return data ?? [];
  },

  async incrementCallAttempt(id: string) {
    const { error } = await supabaseAdmin
      .from("leads")
      .update({
        call_attempts: supabase.rpc("increment", { row_id: id }),
        last_called_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw new AppError(400, error.message);
  },

  async markAsContacted(id: string) {
    const { error } = await supabaseAdmin
      .from("leads")
      .update({
        status: "contacted",
        auto_call_excluded: true,
        last_called_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw new AppError(400, error.message);
  },

  async excludeFromAutoCalls(id: string) {
    const { error } = await supabaseAdmin
      .from("leads")
      .update({ auto_call_excluded: true })
      .eq("id", id);

    if (error) throw new AppError(400, error.message);
  },

};