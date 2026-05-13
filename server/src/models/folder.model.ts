import { supabase } from "../config/supabase";
import { AppError } from "../middleware/error.middleware";

interface CreateFolderDto {
  name: string;
}

export const FolderModel = {
  async createFolder(data: CreateFolderDto, userId: string) {
    const { data: result, error } = await supabase
      .from("lead_folders")
      .insert([{ ...data, user_id: userId }])
      .select()
      .single();

    if (error) throw new AppError(400, error.message);
    return result;
  },

  async getFolders(userId: string) {
    const { data, error } = await supabase
      .from("lead_folders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) throw new AppError(500, error.message);
    return data;
  },

  async renameFolder(id: string, userId: string, name: string) {
    const { data, error } = await supabase
      .from("lead_folders")
      .update({ name })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw new AppError(400, error.message);
    if (!data) throw new AppError(404, "Folder not found");
    return data;
  },

  async deleteFolder(id: string, userId: string) {
    // leads with this folder_id will become null (set null on delete cascade)
    const { error } = await supabase
      .from("lead_folders")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw new AppError(400, error.message);
  },
};