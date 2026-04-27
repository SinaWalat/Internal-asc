'use server';

import sgMail from '@sendgrid/mail';

export async function sendStatusUpdateEmail(
  email: string,
  name: string,
  status: string,
  message?: string
) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    console.error('SendGrid environment variables not set.');
    return { success: false, error: 'Email configuration missing' };
  }

  sgMail.setApiKey(apiKey);

  let subject = `Update on your Missing Card Report`;
  let statusColor = '#3b82f6'; // blue
  let statusText = status;

  switch (status) {
    case 'found':
      subject = 'Good News: Your Missing Card Has Been Found!';
      statusColor = '#22c55e'; // green
      statusText = 'Found';
      break;
    case 'searching':
      subject = 'Update: We are Searching for Your Card';
      statusColor = '#eab308'; // yellow
      statusText = 'Searching';
      break;
    case 'not_found':
      subject = 'Update: Missing Card Not Found';
      statusColor = '#ef4444'; // red
      statusText = 'Not Found';
      break;
    case 'returned':
      subject = 'Missing Card Returned';
      statusColor = '#64748b'; // slate
      statusText = 'Returned';
      break;
  }

  const msg = {
    to: email,
    from: fromEmail,
    subject: subject,
    html: `
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
                      Missing Card Update
                    </h1>

                    <!-- Body Text -->
                    <p style="margin: 0 0 16px 0; font-size: 16px; color: #525252; line-height: 1.6;">
                      Hello <strong style="color: #000000;">${name}</strong>,
                    </p>

                    <p style="margin: 0 0 30px 0; font-size: 16px; color: #525252; line-height: 1.6;">
                      The status of your missing card report has been updated to:
                    </p>

                    <!-- Status Badge -->
                    <div style="display: inline-block; padding: 12px 24px; background-color: ${statusColor}15; border: 1.5px solid ${statusColor}; border-radius: 6px; margin-bottom: 30px;">
                      <span style="font-size: 16px; font-weight: 600; color: ${statusColor};">
                        ${statusText}
                      </span>
                    </div>

                    ${status === 'found'
        ? `
                    <!-- Found - Next Steps -->
                    <div style="margin: 30px 0; padding: 20px; background-color: #f0fdf4; border-radius: 6px; border: 1px solid #86efac;">
                      <h3 style="margin: 0 0 12px 0; color: #166534; font-size: 16px; font-weight: 600;">
                        Next Steps
                      </h3>
                      <p style="margin: 0 0 8px 0; color: #166534; font-size: 15px; line-height: 1.6;">
                        Please visit the administration office at your university to retrieve your card.
                      </p>
                      <p style="margin: 0; color: #15803d; font-size: 14px; line-height: 1.6;">
                        Make sure to bring a valid ID for verification.
                      </p>
                    </div>
                    `
        : status === 'not_found'
          ? `
                    <!-- Not Found - Reprint Info -->
                    <div style="margin: 30px 0; padding: 20px; background-color: #fef2f2; border-radius: 6px; border: 1px solid #fca5a5;">
                      <h3 style="margin: 0 0 12px 0; color: #991b1b; font-size: 16px; font-weight: 600;">
                        Request a Replacement
                      </h3>
                      <p style="margin: 0; color: #991b1b; font-size: 15px; line-height: 1.6;">
                        You can order a replacement card through your student portal.
                      </p>
                    </div>
                    `
          : ''
      }

                    ${message
        ? `
                    <!-- Admin Message -->
                    <div style="margin: 30px 0; padding: 18px 20px; background-color: #f5f5f5; border-radius: 6px; border-left: 3px solid ${statusColor};">
                      <p style="margin: 0 0 6px 0; color: #737373; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">
                        Message from Admin
                      </p>
                      <p style="margin: 0; color: #262626; font-size: 15px; line-height: 1.6;">
                        "${message}"
                      </p>
                    </div>
                    `
        : ''
      }

                    <!-- Info Text -->
                    <p style="margin: 30px 0 0 0; color: #737373; font-size: 14px; line-height: 1.6;">
                      You can check your status anytime using your ticket code in the student portal.
                    </p>

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
    `,
  };

  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    console.error('Error sending status update email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}
