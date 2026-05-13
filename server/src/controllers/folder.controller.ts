import { Response, NextFunction } from "express";
import { FolderModel } from "../models/folder.model";
import { AuthRequest } from "../types";
import { AppError } from "../middleware/error.middleware";

export const FolderController = {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await FolderModel.createFolder(req.body, req.user!.id);
      res.status(201).json({ success: true, message: "Folder created", data });
    } catch (err) { next(err); }
  },

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await FolderModel.getFolders(req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  },

  async rename(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name } = req.body;

      if (!id || Array.isArray(id)) throw new AppError(400, "Invalid ID");
      if (!name) throw new AppError(400, "Name is required");

      const data = await FolderModel.renameFolder(id, req.user!.id, name);
      res.status(200).json({ success: true, message: "Folder renamed", data });
    } catch (err) { next(err); }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id || Array.isArray(id)) throw new AppError(400, "Invalid ID");

      await FolderModel.deleteFolder(id, req.user!.id);
      res.status(200).json({ success: true, message: "Folder deleted" });
    } catch (err) { next(err); }
  },
};