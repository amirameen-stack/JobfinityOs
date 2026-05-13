import { Request, Response, NextFunction } from "express";
import { UserModel } from "../models/user.model";
import { AuthRequest } from "../types";
import { AppError } from "../middleware/error.middleware";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "none" as const,
  path: "/",
};

const sanitizeUser = (user: any) => ({
  id: user.id,
  email: user.email,
  username: user.user_metadata?.name ?? null,
});

export const AuthController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, username } = req.body;
      if (!email || !password || !username) {
        throw new AppError(400, "Email, password and username are required");
      }
      const data = await UserModel.register(email, password, username);
      res.status(201).json({
        success: true,
        message: "Registered successfully. Please verify your email.",
        data: { user: sanitizeUser(data.user) },
      });
    } catch (err) { next(err); }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      if (!email || !password) throw new AppError(400, "Email and password are required");

      const data = await UserModel.login(email, password);

      res.cookie("token", data.session?.access_token, {
        ...COOKIE_OPTIONS,
        maxAge: 60 * 60 * 1000, // 1 hour
      });
      res.cookie("refresh_token", data.session?.refresh_token, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
      });

      res.status(200).json({
        success: true,
        message: "Logged in successfully",
        data: { user: sanitizeUser(data.user) },
      });
    } catch (err) { next(err); }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refresh_token;
      if (!refreshToken) throw new AppError(401, "No refresh token");

      const data = await UserModel.refreshSession(refreshToken);

      res.cookie("token", data.session?.access_token, {
        ...COOKIE_OPTIONS,
        maxAge: 60 * 60 * 1000,
      });

      if (data.session?.refresh_token) {
        res.cookie("refresh_token", data.session.refresh_token, {
          ...COOKIE_OPTIONS,
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: "/",
        });
      }

      res.status(200).json({ success: true, message: "Token refreshed" });
    } catch (err) { next(err); }
  },

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.token;
      if (token) await UserModel.logout(token);

      res.clearCookie("token", { ...COOKIE_OPTIONS });
      res.clearCookie("refresh_token", { ...COOKIE_OPTIONS, path: "/api/auth/refresh" });

      res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (err) { next(err); }
  },

  async profile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        data: { user: sanitizeUser(req.user) },
      });
    } catch (err) { next(err); }
  },
};