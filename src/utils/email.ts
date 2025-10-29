import nodemailer from 'nodemailer';
import logger from '../config/logger';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }) {
    try {
      const mailOptions = {
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error('Email sending failed:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(to: string, name: string, verificationToken: string) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to Employment Platform</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Employment Platform!</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Thank you for joining our global employment platform. We're excited to help you find your dream job abroad!</p>
              <p>To get started, please verify your email address by clicking the button below:</p>
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p>${verificationUrl}</p>
              <p>This verification link will expire in 24 hours.</p>
            </div>
            <div class="footer">
              <p>Best regards,<br>The Employment Platform Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: 'Welcome to Employment Platform - Verify Your Email',
      html,
    });
  }

  async sendPasswordResetEmail(to: string, name: string, resetToken: string) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Password Reset Request</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>We received a request to reset your password. If you didn't make this request, please ignore this email.</p>
              <p>To reset your password, click the button below:</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p>${resetUrl}</p>
              <p>This reset link will expire in 1 hour for security reasons.</p>
            </div>
            <div class="footer">
              <p>Best regards,<br>The Employment Platform Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: 'Password Reset Request - Employment Platform',
      html,
    });
  }

  async sendApplicationAcceptedEmail(to: string, name: string, jobTitle: string) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Application Accepted!</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Application Accepted!</h1>
            </div>
            <div class="content">
              <h2>Congratulations ${name}!</h2>
              <p>Great news! Your application for <strong>${jobTitle}</strong> has been accepted.</p>
              <p>The next step is to complete your assessment. Please log in to your dashboard to proceed.</p>
              <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Go to Dashboard</a>
            </div>
            <div class="footer">
              <p>Best regards,<br>The Employment Platform Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: `Application Accepted: ${jobTitle}`,
      html,
    });
  }

  async sendApplicationRejectedEmail(to: string, name: string, jobTitle: string, feedback?: string) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Application Update</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Application Update</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Thank you for your interest in the <strong>${jobTitle}</strong> position.</p>
              <p>After careful consideration, we have decided not to move forward with your application at this time.</p>
              ${feedback ? `<p><strong>Feedback:</strong> ${feedback}</p>` : ''}
              <p>We encourage you to apply for other positions that match your skills and experience.</p>
              <a href="${process.env.FRONTEND_URL}/jobs" class="button">Browse Jobs</a>
            </div>
            <div class="footer">
              <p>Best regards,<br>The Employment Platform Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: `Application Update: ${jobTitle}`,
      html,
    });
  }

  async sendApplicationStatusEmail(to: string, name: string, jobTitle: string, company: string, status: string) {
    const statusMessages = {
      reviewing: 'Your application is now under review',
      interview: 'Congratulations! You have been selected for an interview',
      offer: 'Great news! You have received a job offer',
      accepted: 'Welcome aboard! Your application has been accepted',
      rejected: 'Thank you for your interest. Unfortunately, we cannot proceed with your application at this time'
    };

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Application Status Update</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .status { padding: 15px; background: #e0f2fe; border-left: 4px solid #0284c7; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Application Status Update</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>We have an update regarding your application for the position of <strong>${jobTitle}</strong> at <strong>${company}</strong>.</p>
              <div class="status">
                <h3>Status: ${status.toUpperCase()}</h3>
                <p>${statusMessages[status as keyof typeof statusMessages]}</p>
              </div>
              <p>You can view more details and track your application progress by logging into your dashboard.</p>
              <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">View Dashboard</a>
            </div>
            <div class="footer">
              <p>Best regards,<br>The Employment Platform Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: `Application Update: ${jobTitle} at ${company}`,
      html,
    });
  }
}

export default new EmailService();