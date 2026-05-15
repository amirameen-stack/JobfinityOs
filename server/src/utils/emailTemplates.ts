/**
 * Professional Email Template for Proposals
 * Designed for JobfinityOS CRM
 */
export const getProposalEmailTemplate = (params: {
  companyName: string;
  contactName: string;
  proposalHtml: string;
  senderName: string;
  date: string;
}) => {
  const { companyName, contactName, proposalHtml, senderName, date } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Business Proposal - ${companyName}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f7fa;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f4f7fa;
      padding-bottom: 40px;
    }
    .main-content {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0,0,0,0.05);
      margin-top: 40px;
    }
    .header {
      background: linear-gradient(135deg, #1E6FD9 0%, #12407B 100%);
      padding: 40px 40px;
      text-align: left;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .header p {
      color: rgba(255, 255, 255, 0.8);
      margin: 8px 0 0;
      font-size: 14px;
    }
    .body {
      padding: 40px;
      color: #334155;
      line-height: 1.6;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 20px;
    }
    .proposal-container {
      border-top: 1px solid #e2e8f0;
      padding-top: 30px;
      margin-top: 30px;
    }
    /* Proposal HTML Styles Override for Email */
    .proposal-container h1 { font-size: 20px; color: #1E6FD9; margin-top: 0; }
    .proposal-container h2 { font-size: 16px; color: #1E6FD9; margin-top: 24px; }
    .proposal-container p { margin: 12px 0; color: #475569; }
    .proposal-container ul, .proposal-container ol { padding-left: 20px; }
    .proposal-container li { margin-bottom: 8px; }
    .proposal-container img { max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0; display: block; }
    .proposal-container a { color: #1E6FD9; text-decoration: underline; }
    .signature-section { 
      margin-top: 40px; 
      border-top: 1px solid #e2e8f0; 
      padding-top: 20px; 
    }
    .signature-table {
      width: 100%;
    }
    .signature-cell { 
      width: 50%; 
      vertical-align: top; 
      padding: 0 10px;
    }
    .signature-line {
      border-bottom: 1px solid #333333;
      height: 40px;
      margin-bottom: 8px;
    }
    
    .footer {
      max-width: 600px;
      margin: 0 auto;
      padding: 30px 20px;
      text-align: center;
    }
    .footer p {
      color: #94a3b8;
      font-size: 12px;
      margin: 5px 0;
    }
    .footer-links {
      margin-top: 15px;
    }
    .footer-links a {
      color: #1E6FD9;
      text-decoration: none;
      margin: 0 10px;
      font-size: 12px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background-color: #e0f2fe;
      color: #0369a1;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 15px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="main-content">
      <div class="header">
        <div class="badge">JobfinityOS Proposal</div>
        <h1>Business Proposal</h1>
        <p>Prepared for ${companyName} &bull; ${date}</p>
      </div>
      
      <div class="body">
        <div class="greeting">Hello ${contactName},</div>
        <p>It was a pleasure discussing your requirements recently. Based on our conversation, we have prepared a detailed proposal for <strong>${companyName}</strong>.</p>
        <p>You can find the full document detailed below, and a PDF version is attached to this email for your records.</p>
        
        <div class="proposal-container">
          ${proposalHtml}
        </div>
        
        <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
          <p style="margin: 0; font-size: 14px; color: #64748b;">Best regards,</p>
          <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600; color: #1e293b;">${senderName}</p>
          <p style="margin: 0; font-size: 13px; color: #94a3b8;">JobfinityOS CRM Team</p>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} JobfinityOS CRM. All rights reserved.</p>
      <p>This is an automated message sent securely via JobfinityOS.</p>
      <div class="footer-links">
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Service</a>
        <a href="#">Contact Support</a>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};
