import { Response, NextFunction } from "express";
import { supabase } from "../config/supabase";
import { AuthRequest } from "../types";
import { AppError } from "./error.middleware";

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.token;

    if (!token) throw new AppError(401, "Authentication required");

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) throw new AppError(401, "Invalid or expired session");

    req.user = data.user;
    next();
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
    } else {
      next(new AppError(401, "Invalid or expired session"));
    }
  }
};