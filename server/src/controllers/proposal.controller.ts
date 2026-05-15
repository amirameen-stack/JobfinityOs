import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { AppError } from "../middleware/error.middleware";
import { supabaseAdmin } from "../config/supabase";
import { LeadFileModel } from "../models/leadFile.model";
import { getProposalEmailTemplate } from "../utils/emailTemplates";

export const ProposalController = {
  async sendProposal(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { leadId, html, pdfBase64, subject, sendEmail = true } = req.body;

      if (!leadId) throw new AppError(400, "leadId is required");
      if (!html)   throw new AppError(400, "html is required");

      // Fetch lead details
      const { data: lead, error: leadError } = await supabaseAdmin
        .from("leads")
        .select("id, email, contact_name, company_name")
        .eq("id", leadId)
        .eq("user_id", req.user!.id)
        .single();

      if (leadError || !lead) throw new AppError(404, "Lead not found");

      const RESEND_API_KEY = process.env.RESEND_API_KEY;
      let emailSent = false;

      // Only attempt to send email if sendEmail is true AND we have an API key
      if (sendEmail && RESEND_API_KEY) {
        const { Resend } = await import("resend");
        const resend = new Resend(RESEND_API_KEY);

        const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
        const emailSubject = subject || `Proposal for ${lead.company_name}`;

        const attachments: Array<{ filename: string; content: string }> = [];
        if (pdfBase64) {
          attachments.push({
            filename: `Proposal-${lead.company_name}.pdf`,
            content: pdfBase64,
          });
        }

        const senderName = req.user?.user_metadata?.full_name || req.user?.email || "Your Account Manager";
        const emailHtml = getProposalEmailTemplate({
          companyName: lead.company_name,
          contactName: lead.contact_name,
          proposalHtml: html,
          senderName,
          date: new Date().toLocaleDateString(),
        });

        const { error: emailError } = await resend.emails.send({
          from: fromEmail,
          to: lead.email,
          subject: emailSubject,
          html: emailHtml,
          attachments,
        } as any);

        if (emailError) throw new AppError(500, `Email failed: ${(emailError as any).message}`);
        emailSent = true;
      } else {
        console.log(`[proposal] No RESEND_API_KEY — skipping email to ${lead.email}`);
      }

      // Always save PDF to lead's documents if provided
      if (pdfBase64) {
        const pdfBuffer = Buffer.from(pdfBase64, "base64");
        const fileName = `Proposal-${lead.company_name}-${Date.now()}.pdf`;
        const storagePath = `${req.user!.id}/${leadId}/${fileName}`;

        const { error: storageErr } = await supabaseAdmin.storage
          .from("lead-files")
          .upload(storagePath, pdfBuffer, { contentType: "application/pdf", upsert: false });

        if (!storageErr) {
          const { data: urlData } = supabaseAdmin.storage
            .from("lead-files")
            .getPublicUrl(storagePath);

          await LeadFileModel.createFile({
            lead_id: leadId,
            name: fileName,
            path: storagePath,
            url: urlData.publicUrl,
            user_id: req.user!.id,
          });
        }
      }

      res.status(200).json({
        success: true,
        message: emailSent
          ? `Proposal emailed to ${lead.email} and saved to documents`
          : `PDF saved to lead documents (configure RESEND_API_KEY to enable email)`,
        email: lead.email,
      });
    } catch (err) {
      next(err);
    }
  },

  async getLeadById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id || Array.isArray(id)) throw new AppError(400, "Invalid ID");

      const { data, error } = await supabaseAdmin
        .from("leads")
        .select("*, lead_folders(id, name)")
        .eq("id", id)
        .eq("user_id", req.user!.id)
        .single();

      if (error || !data) throw new AppError(404, "Lead not found");
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};
