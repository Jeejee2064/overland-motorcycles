// app/api/send-email/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { to, subject, message, recipientName } = await request.json();

    // Using Resend API (you'll need to install: npm install resend)
    // Alternative: Use nodemailer, SendGrid, or any email service
    
    // For now, using a simple fetch to Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Overland Motorcycles <overlandmotorcycles@gmail.com>',
        to: [to],
        subject: subject,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body {
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                }
                .header {
                  background: linear-gradient(135deg, #FACC15 0%, #EAB308 100%);
                  color: #1F2937;
                  padding: 30px;
                  text-align: center;
                  border-radius: 10px 10px 0 0;
                }
                .content {
                  background: #ffffff;
                  padding: 30px;
                  border: 1px solid #e5e7eb;
                  border-top: none;
                }
                .message {
                  white-space: pre-wrap;
                  background: #f9fafb;
                  padding: 20px;
                  border-radius: 8px;
                  border-left: 4px solid #FACC15;
                  margin: 20px 0;
                }
                .footer {
                  background: #f9fafb;
                  padding: 20px;
                  text-align: center;
                  border-radius: 0 0 10px 10px;
                  border: 1px solid #e5e7eb;
                  border-top: none;
                  font-size: 12px;
                  color: #6b7280;
                }
                .logo {
                  font-size: 24px;
                  font-weight: bold;
                  margin-bottom: 10px;
                }
                .contact-info {
                  margin-top: 20px;
                  padding-top: 20px;
                  border-top: 1px solid #e5e7eb;
                  font-size: 14px;
                  color: #6b7280;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <div class="logo">🏍️ OVERLAND MOTORCYCLES</div>
                <p style="margin: 0; font-size: 14px;">Adventure Awaits</p>
              </div>
              
              <div class="content">
                <p>Hello ${recipientName},</p>
                
                <div class="message">
                  ${message.replace(/\n/g, '<br>')}
                </div>
                
                <div class="contact-info">
                  <strong>Contact Us:</strong><br>
                  📧 overlandmotorcycles@gmail.com<br>
                  📞 +507 6805-1100<br>
                  📍 Local 1 - Edificio Antigua Domingo, Plaza Santa Ana, Panama City, Panama
                </div>
              </div>
              
              <div class="footer">
                <p>© ${new Date().getFullYear()} Overland Motorcycles. All rights reserved.</p>
                <p>This email was sent in response to your inquiry.</p>
              </div>
            </body>
          </html>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Resend API error:', error);
      throw new Error('Failed to send email');
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Error in send-email API:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/* 
============================================
SETUP INSTRUCTIONS FOR EMAIL:
============================================

OPTION 1: Using Resend (Recommended - Easiest)
----------------------------------------------
1. Install: npm install resend
2. Sign up at https://resend.com (free tier: 100 emails/day)
3. Verify your domain OR use their test domain
4. Get your API key from dashboard
5. Add to .env.local:
   RESEND_API_KEY=re_your_api_key_here

OPTION 2: Using Gmail SMTP with Nodemailer
-------------------------------------------
1. Install: npm install nodemailer
2. Enable "App Passwords" in your Gmail account:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App Passwords
   - Generate password for "Mail"
3. Add to .env.local:
   GMAIL_USER=overlandmotorcycles@gmail.com
   GMAIL_APP_PASSWORD=your_16_char_app_password

Then replace the fetch code above with:

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

await transporter.sendMail({
  from: '"Overland Motorcycles" <overlandmotorcycles@gmail.com>',
  to: to,
  subject: subject,
  html: ... (same HTML as above)
});

OPTION 3: Using SendGrid
-------------------------
1. Install: npm install @sendgrid/mail
2. Sign up at https://sendgrid.com
3. Get API key
4. Add to .env.local:
   SENDGRID_API_KEY=your_api_key

============================================
*/