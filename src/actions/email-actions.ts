'use server';

import sgMail from '@sendgrid/mail';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@yourdomain.com';

function getEmailTemplate(title: string, content: string) {
  return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #fafafa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding: 60px 20px;">
          <tr>
            <td>
              <!-- Main Container -->
              <table width="600" cellpadding="0" cellspacing="0" style="margin: 0 auto; background: white; border-radius: 8px; border: 1px solid #e5e5e5;">
                <tr>
                  <td style="padding: 50px;">
                    
                    <!-- Title -->
                    <h1 style="margin: 0 0 30px 0; font-size: 32px; font-weight: 600; color: #000000; line-height: 1.2;">
                      ${title}
                    </h1>

                    <!-- Body Text -->
                    <div style="margin: 0 0 30px 0; font-size: 16px; color: #525252; line-height: 1.6;">
                      ${content}
                    </div>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 50px; border-top: 1px solid #e5e5e5;">
                    <p style="margin: 0 0 8px 0; color: #737373; font-size: 13px; line-height: 1.5;">
                      This is an automated message from your Student Portal
                    </p>
                    <p style="margin: 0; color: #a3a3a3; font-size: 12px;">
                      © ${new Date().getFullYear()} Student Portal. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
}

export async function sendKYCApprovalEmail(email: string, name: string) {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY is not set');
    return { success: false, error: 'Email service not configured' };
  }

  const content = `
        <p>Dear <strong>${name}</strong>,</p>
        <p>We are pleased to inform you that your KYC verification has been <strong style="color: #16a34a;">approved</strong>.</p>
        <p>You now have full access to all student features.</p>
        <p>Best regards,<br/>The Admin Team</p>
    `;

  const html = getEmailTemplate('KYC Verification Approved', content);

  const msg = {
    to: email,
    from: FROM_EMAIL,
    subject: 'KYC Verification Approved',
    html: html,
  };

  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending approval email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendKYCRejectionEmail(email: string, name: string) {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY is not set');
    return { success: false, error: 'Email service not configured' };
  }

  const content = `
        <p>Dear <strong>${name}</strong>,</p>
        <p>We regret to inform you that your KYC verification has been <strong style="color: #dc2626;">rejected</strong>.</p>
        <p>Please review your documents and ensure they are clear and valid before resubmitting.</p>
        <p>If you have any questions, please contact support.</p>
        <p>Best regards,<br/>The Admin Team</p>
    `;

  const html = getEmailTemplate('KYC Verification Update', content);

  const msg = {
    to: email,
    from: FROM_EMAIL,
    subject: 'KYC Verification Update',
    html: html,
  };

  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending rejection email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendPasswordResetEmail(email: string, resetLink: string) {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY is not set');
    return { success: false, error: 'Email service not configured' };
  }

  const content = `
        <p>Hello,</p>
        <p>We received a request to reset your password for your Student Portal account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Reset Password</a>
        </div>
        <p>If you didn't ask to reset your password, you can safely ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
        <p>Best regards,<br/>The Student Portal Team</p>
    `;

  const html = getEmailTemplate('Reset Your Password', content);

  const msg = {
    to: email,
    from: FROM_EMAIL,
    subject: 'Reset Your Password',
    html: html,
  };

  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
}
