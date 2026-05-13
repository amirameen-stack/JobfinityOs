import { Request } from "express";
import { User } from "@supabase/supabase-js";

// Extend Express Request to carry the authenticated user
export interface AuthRequest extends Request {
  user?: User;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
export {};