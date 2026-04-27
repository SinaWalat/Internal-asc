
'use server';
/**
 * @fileOverview A flow for sending One-Time Passwords (OTPs) via email using SendGrid.
 * This flow's only responsibility is to send an email. It does not handle OTP storage.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import sgMail from '@sendgrid/mail';

const SendOtpInputSchema = z.object({
  email: z.string().email().describe('The recipient\'s email address.'),
  otp: z.string().length(6).describe('The 6-digit one-time password.'),
});
type SendOtpInput = z.infer<typeof SendOtpInputSchema>;

export async function sendOtp(input: SendOtpInput): Promise<void> {
  return sendOtpFlow(input);
}

const sendOtpFlow = ai.defineFlow(
  {
    name: 'sendOtpFlow',
    inputSchema: SendOtpInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;

    if (!apiKey || !fromEmail) {
      console.error('SendGrid environment variables not set.');
      throw new Error(
        'SendGrid API key or sender email is not configured in environment variables.'
      );
    }

    sgMail.setApiKey(apiKey);

    const msg = {
      to: input.email,
      from: fromEmail,
      subject: 'Your One-Time Password (OTP)',
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
                        Your Verification Code
                      </h1>

                      <!-- Body Text -->
                      <p style="margin: 0 0 30px 0; font-size: 16px; color: #525252; line-height: 1.6;">
                        Please use the following code to complete your registration. This code is valid for 10 minutes.
                      </p>

                      <!-- OTP Code -->
                      <div style="display: inline-block; padding: 20px 32px; background-color: #f5f5f5; border: 1.5px solid #e5e5e5; border-radius: 6px; margin-bottom: 30px;">
                        <span style="font-size: 28px; font-weight: 700; letter-spacing: 8px; color: #000000; font-family: 'Courier New', monospace;">
                          ${input.otp}
                        </span>
                      </div>

                      <!-- Info Text -->
                      <p style="margin: 30px 0 0 0; color: #737373; font-size: 14px; line-height: 1.6;">
                        If you did not request this code, please ignore this email.
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
    } catch (error) {
      console.error('Error sending OTP email:', error);
      // It's important to not expose detailed SendGrid errors to the client.
      throw new Error('There was an issue sending the verification email.');
    }
  }
);
