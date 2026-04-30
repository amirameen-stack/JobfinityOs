import { supabase } from "../config/supabase";
import { supabaseAdmin } from "../config/supabase";
import { AppError } from "../middleware/error.middleware";

export const UserModel = {
  async register(email: string, password: string, username: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: username } },
    });
    if (error) throw new AppError(400, error.message);
    return data;
  },

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new AppError(401, "Invalid credentials");
    return data;
  },

  async refreshSession(refreshToken: string) {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });
    if (error) throw new AppError(401, "Session expired, please log in again");
    return data;
  },

  async logout(token: string) {
    // Use admin client to revoke the specific token server-side
    await supabaseAdmin.auth.admin.signOut(token, "local");
  },
};