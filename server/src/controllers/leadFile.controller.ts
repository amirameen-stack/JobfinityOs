import { Response, NextFunction } from "express";
import multer from "multer";
import { AuthRequest } from "../types";
import { LeadFileModel } from "../models/leadFile.model";
import { AppError } from "../middleware/error.middleware";
import { supabaseAdmin } from "../config/supabase";

// Store file in memory so we can send it to Supabase Storage
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/png", "image/jpeg", "image/jpg",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type"));
    }
  },
});

export const LeadFileController = {
  async upload(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { lead_id } = req.body;
      const file = req.file;

      console.log("Upload request received:", { lead_id, fileName: file?.originalname, size: file?.size, mimetype: file?.mimetype });

      if (!lead_id) throw new AppError(400, "lead_id is required");
      if (!file)    throw new AppError(400, "File is required");

      // Build a unique path inside the bucket
      const ext = file.originalname.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const storagePath = `${req.user!.id}/${lead_id}/${fileName}`;

      // Upload to Supabase Storage bucket "lead-files"
      // (Bucket is guaranteed to exist — initialised at server startup in app.ts)
      const { error: storageError } = await supabaseAdmin.storage
        .from("lead-files")
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (storageError) throw new AppError(500, storageError.message);

      // Get the public URL
      const { data: urlData } = supabaseAdmin.storage
        .from("lead-files")
        .getPublicUrl(storagePath);

      // Save record to the database
      const data = await LeadFileModel.createFile({
        lead_id,
        name: file.originalname,
        path: storagePath,
        url: urlData.publicUrl,
        user_id: req.user!.id,
      });

      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getByLead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { leadId } = req.params;
      if (!leadId || Array.isArray(leadId)) throw new AppError(400, "Invalid lead ID");

      const data = await LeadFileModel.getFilesByLead(leadId, req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await LeadFileModel.getAllFiles(req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { fileId } = req.params;
      if (!fileId || Array.isArray(fileId)) throw new AppError(400, "Invalid file ID");

      await LeadFileModel.deleteFile(fileId, req.user!.id);
      res.status(200).json({ success: true, message: "File deleted" });
    } catch (err) {
      next(err);
    }
  },
};