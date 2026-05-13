import { supabase, supabaseAdmin } from "../config/supabase";
import { AppError } from "../middleware/error.middleware";

type CallStatus = "initiated" | "ringing" | "in-progress" | "completed" | "failed" | "busy" | "no-answer";

interface TranscriptEntry {
  role: "agent" | "prospect";
  text: string;
  timestamp: string;
}

interface CreateCallDto {
  lead_id: string;
  twilio_sid: string;
  to_number: string;
}

interface UpdateCallDto {
  status?: CallStatus;
  duration?: number;
  transcript?: TranscriptEntry[];
}

export const CallModel = {

  async createCall(data: CreateCallDto, userId: string) {
    const { data: result, error } = await supabase
      .from("calls")
      .insert([{
        ...data,
        user_id: userId,
        status: "initiated",
        transcript: [],
      }])
      .select()
      .single();

    if (error) throw new AppError(400, error.message);
    return result;
  },

  async getCallsByLead(leadId: string, userId: string) {
    const { data, error } = await supabase
      .from("calls")
      .select("*")
      .eq("lead_id", leadId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new AppError(500, error.message);
    return data;
  },

  async getCallByTwilioSid(twilioSid: string) {
    const { data, error } = await supabaseAdmin
      .from("calls")
      .select("*")
      .eq("twilio_sid", twilioSid)
      .single();

    if (error) throw new AppError(404, "Call not found");
    return data;
  },

  async getAllCalls(userId: string) {
    const { data, error } = await supabase
      .from("calls")
      .select("*, leads(id, company_name, contact_name)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new AppError(500, error.message);
    return data;
  },

  async updateCall(twilioSid: string, updates: UpdateCallDto) {
    const { data, error } = await supabaseAdmin
      .from("calls")
      .update(updates)
      .eq("twilio_sid", twilioSid)
      .select()
      .single();

    if (error) throw new AppError(400, error.message);
    if (!data) throw new AppError(404, "Call not found");
    return data;
  },

  async appendTranscript(twilioSid: string, entry: TranscriptEntry) {
    // fetch current transcript first, then append
    const call = await CallModel.getCallByTwilioSid(twilioSid);
    const updated: TranscriptEntry[] = [...(call.transcript ?? []), entry];

    const { data, error } = await supabaseAdmin
      .from("calls")
      .update({ transcript: updated })
      .eq("twilio_sid", twilioSid)
      .select()
      .single();

    if (error) throw new AppError(400, error.message);
    return data;
  },

  async deleteCall(id: string, userId: string) {
    const { error } = await supabase
      .from("calls")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw new AppError(400, error.message);
  },
};