import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create Nodemailer Transporter
const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  // Fallback to json transport / test transport for demonstration if credentials not yet configured
  return nodemailer.createTransport({
    jsonTransport: true,
  });
};

const transporter = createTransporter();

export interface RosterEmailData {
  staffName: string;
  staffEmail: string;
  day: string;
  dateStr?: string;
  shift: string;
  timeRange: string;
  location?: string;
  tasks?: string;
}

export interface DutySwapEmailData {
  staffA: { name: string; email: string; originalShift: string; newShift: string; day: string };
  staffB: { name: string; email: string; originalShift: string; newShift: string; day: string };
  reason?: string;
}

// 1. Send Roster Assignment Notification
export const sendRosterNotificationEmail = async (data: RosterEmailData) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background: #1e40af; color: #ffffff; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 800; }
        .header p { margin: 4px 0 0; font-size: 13px; opacity: 0.9; }
        .content { padding: 24px; }
        .card { background: #f1f5f9; border-radius: 12px; padding: 18px; margin: 16px 0; border-left: 5px solid #2563eb; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 12px; background: #2563eb; color: #ffffff; }
        .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
        .label { color: #64748b; font-weight: 600; }
        .value { color: #0f172a; font-weight: 700; }
        .footer { text-align: center; padding: 16px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>IT Operations Duty Roster</h1>
          <p>Official Shift Assignment Notification</p>
        </div>
        <div class="content">
          <p>Hello <strong>${data.staffName}</strong>,</p>
          <p>You have been assigned to a duty shift on the IT operations schedule. Please review your shift details below:</p>
          
          <div class="card">
            <div class="row">
              <span class="label">Day & Date:</span>
              <span class="value">${data.day} ${data.dateStr ? `(${data.dateStr})` : ''}</span>
            </div>
            <div class="row">
              <span class="label">Assigned Shift:</span>
              <span class="badge">${data.shift}</span>
            </div>
            <div class="row">
              <span class="label">Shift Timing:</span>
              <span class="value">${data.timeRange}</span>
            </div>
            <div class="row">
              <span class="label">Location:</span>
              <span class="value">${data.location || 'HQ Floor 4 / Server Room'}</span>
            </div>
            ${data.tasks ? `
            <div class="row" style="margin-top: 10px; border-top: 1px dashed #cbd5e1; padding-top: 8px;">
              <span class="label">Key Focus:</span>
              <span class="value">${data.tasks}</span>
            </div>` : ''}
          </div>

          <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
            * Please ensure punctuality for smooth handover. If you require a duty shift swap, submit a Duty Swap request on the IT Dashboard.
          </p>
        </div>
        <div class="footer">
          IT Operations Control Platform &bull; Automated System Dispatch
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const fromAddress = process.env.SMTP_FROM || 'it-operations@company.local';
    const info = await transporter.sendMail({
      from: `"IT Operations Roster" <${fromAddress}>`,
      to: data.staffEmail || `${data.staffName.toLowerCase()}@company.local`,
      subject: `[Duty Roster] Your IT Shift for ${data.day}: ${data.timeRange}`,
      html: htmlContent,
    });
    console.log('✅ Duty roster notification email sent to:', data.staffName, info.messageId || 'json-transport');
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.warn('⚠️ Nodemailer delivery error (logged):', err.message);
    return { success: false, error: err.message };
  }
};

// 2. Send Duty Swap Notification to both parties
export const sendDutySwapNotificationEmail = async (data: DutySwapEmailData) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background: #d97706; color: #ffffff; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 800; }
        .content { padding: 24px; }
        .swap-box { background: #fef3c7; border: 1px solid #fde68a; border-radius: 12px; padding: 16px; margin: 16px 0; }
        .party { padding: 10px; background: #ffffff; border-radius: 8px; margin-bottom: 8px; border: 1px solid #e2e8f0; font-size: 13px; }
        .footer { text-align: center; padding: 16px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Duty Shift Swap Confirmation</h1>
          <p style="margin: 4px 0 0; font-size: 13px;">Official IT Operations Notice</p>
        </div>
        <div class="content">
          <p>Hello <strong>${data.staffA.name}</strong> & <strong>${data.staffB.name}</strong>,</p>
          <p>A duty shift swap has been approved and updated on the active IT Duty Roster:</p>

          <div class="swap-box">
            <div class="party">
              <strong>${data.staffA.name}</strong> (${data.staffA.day})<br />
              <span style="color: #64748b;">Previous:</span> ${data.staffA.originalShift} &rarr; <strong style="color: #059669;">New: ${data.staffA.newShift}</strong>
            </div>
            <div class="party">
              <strong>${data.staffB.name}</strong> (${data.staffB.day})<br />
              <span style="color: #64748b;">Previous:</span> ${data.staffB.originalShift} &rarr; <strong style="color: #059669;">New: ${data.staffB.newShift}</strong>
            </div>
            ${data.reason ? `<p style="margin: 8px 0 0; font-size: 12px; color: #92400e;"><strong>Reason:</strong> ${data.reason}</p>` : ''}
          </div>

          <p style="font-size: 12px; color: #64748b;">This swap is now officially active on the system.</p>
        </div>
        <div class="footer">
          IT Operations Control Platform &bull; Automated System Dispatch
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const fromAddress = process.env.SMTP_FROM || 'it-operations@company.local';
    const recipients = [
      data.staffA.email || `${data.staffA.name.toLowerCase()}@company.local`,
      data.staffB.email || `${data.staffB.name.toLowerCase()}@company.local`,
    ];

    const info = await transporter.sendMail({
      from: `"IT Operations Roster" <${fromAddress}>`,
      to: recipients.join(', '),
      subject: `[Duty Swap Approved] Shift Exchange between ${data.staffA.name} and ${data.staffB.name}`,
      html: htmlContent,
    });
    console.log('✅ Duty swap notification email sent to:', recipients);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.warn('⚠️ Nodemailer delivery error (logged):', err.message);
    return { success: false, error: err.message };
  }
};
