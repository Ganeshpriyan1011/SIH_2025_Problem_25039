import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Verify connection configuration
    this.verifyConnection();
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      logger.info('Email service connected successfully');
    } catch (error) {
      logger.error('Email service connection failed:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${options.to}. Message ID: ${result.messageId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  async sendOTPEmail(email: string, otp: string, name?: string): Promise<boolean> {
    const subject = 'Verify Your Email - INCOIS Ocean Hazard Reporting Platform';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #0ea5e9;
            margin-bottom: 10px;
          }
          .otp-code {
            background: #0ea5e9;
            color: white;
            padding: 15px 30px;
            font-size: 32px;
            font-weight: bold;
            text-align: center;
            border-radius: 8px;
            margin: 20px 0;
            letter-spacing: 5px;
          }
          .warning {
            background: #fef3cd;
            border: 1px solid #fecaca;
            color: #92400e;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🌊 INCOIS Ocean Hazard Reporting</div>
            <h2>Email Verification Required</h2>
          </div>
          
          ${name ? `<p>Hello ${name},</p>` : '<p>Hello,</p>'}
          
          <p>Thank you for registering with the INCOIS Ocean Hazard Reporting Platform. To complete your registration, please verify your email address using the OTP code below:</p>
          
          <div class="otp-code">${otp}</div>
          
          <p>This verification code will expire in <strong>10 minutes</strong>. If you didn't request this verification, please ignore this email.</p>
          
          <div class="warning">
            <strong>Security Notice:</strong> Never share this OTP with anyone. Government officials will never ask for your OTP via phone or email.
          </div>
          
          <p>If you have any questions or need assistance, please contact our support team.</p>
          
          <div class="footer">
            <p>This is an automated message from INCOIS Ocean Hazard Reporting Platform</p>
            <p>© ${new Date().getFullYear()} Indian National Centre for Ocean Information Services</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html
    });
  }

  async sendWelcomeEmail(email: string, name: string, role: string): Promise<boolean> {
    const subject = 'Welcome to INCOIS Ocean Hazard Reporting Platform';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #0ea5e9;
            margin-bottom: 10px;
          }
          .role-badge {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
            text-transform: capitalize;
          }
          .features {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🌊 INCOIS Ocean Hazard Reporting</div>
            <h2>Welcome to the Platform!</h2>
          </div>
          
          <p>Dear ${name},</p>
          
          <p>Congratulations! Your account has been successfully created and verified. You are now registered as a <span class="role-badge">${role}</span> on the INCOIS Ocean Hazard Reporting Platform.</p>
          
          <div class="features">
            <h3>What you can do now:</h3>
            <ul>
              <li>📍 Report ocean hazards in real-time</li>
              <li>🗺️ View hazard reports on interactive maps</li>
              <li>📱 Access social media feeds for hazard information</li>
              <li>🔔 Receive notifications about hazards in your area</li>
              ${role === 'official' || role === 'analyst' ? '<li>✅ Verify and validate hazard reports</li>' : ''}
              ${role === 'analyst' ? '<li>📊 Access advanced analytics and reporting tools</li>' : ''}
            </ul>
          </div>
          
          <p>Your safety and the safety of coastal communities is our priority. Thank you for joining us in creating a safer maritime environment.</p>
          
          <p>You can now log in to the platform and start using all available features.</p>
          
          <div class="footer">
            <p>Best regards,<br>INCOIS Ocean Hazard Reporting Team</p>
            <p>© ${new Date().getFullYear()} Indian National Centre for Ocean Information Services</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html
    });
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

export const emailService = new EmailService();
