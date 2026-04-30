import { Response, NextFunction } from "express";
import { LeadModel } from "../models/lead.model";
import { AuthRequest } from "../types";
import { AppError } from "../middleware/error.middleware";

export const LeadController = {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await LeadModel.createLead(req.body, req.user!.id);
      res.status(201).json({ success: true, message: "Lead created", data });
    } catch (err) { next(err); }
  },

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await LeadModel.getLeads(req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      throw new AppError(400, "Invalid or missing ID");
    }

    const data = await LeadModel.updateLead(id, req.user!.id, req.body);

    res.status(200).json({ success: true, message: "Lead updated", data });
  } catch (err) { next(err); }
},

 async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || Array.isArray(id)) {
      throw new AppError(400, "Invalid or missing ID");
    }

    if (!["newLeads", "potential", "contacted"].includes(status)) {
      throw new AppError(400, "Invalid status value");
    }

    const data = await LeadModel.updateStatus(id, req.user!.id, status);

    res.status(200).json({ success: true, message: "Status updated", data });
  } catch (err) { next(err); }
},

 async delete(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      throw new AppError(400, "Invalid or missing ID");
    }

    await LeadModel.deleteLead(id, req.user!.id);

    res.status(200).json({ success: true, message: "Lead deleted" });
  } catch (err) { next(err); }
},

// Add inside LeadController in lead.controller.ts
async assignFolder(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { folder_id } = req.body; // null = remove from folder

    if (!id || Array.isArray(id)) throw new AppError(400, "Invalid ID");

    const data = await LeadModel.assignFolder(id, req.user!.id, folder_id ?? null);
    res.status(200).json({ success: true, message: "Folder assigned", data });
  } catch (err) { next(err); }
},
};