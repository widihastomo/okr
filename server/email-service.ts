import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import { db } from './db';
import { systemSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface EmailConfig {
  from: string;
  to: string;
  subject: string;
  html: string;
}

interface EmailProvider {
  name: string;
  sendEmail(config: EmailConfig): Promise<boolean>;
}

// Get email settings from system settings
async function getEmailSettings(): Promise<Record<string, string>> {
  try {
    const settings = await db.select().from(systemSettings).where(eq(systemSettings.category, 'email'));
    const settingsMap: Record<string, string> = {};
    
    for (const setting of settings) {
      if (setting.settingKey && setting.settingValue) {
        settingsMap[setting.settingKey] = setting.settingValue;
      }
    }
    
    return settingsMap;
  } catch (error) {
    console.error('Error fetching email settings:', error);
    return {};
  }
}

// Mailtrap Provider
class MailtrapProvider implements EmailProvider {
  name = 'Mailtrap';
  
  async sendEmail(config: EmailConfig): Promise<boolean> {
    try {
      const settings = await getEmailSettings();
      
      if (!settings.mailtrap_host || !settings.mailtrap_port || !settings.mailtrap_user || !settings.mailtrap_pass) {
        throw new Error('Mailtrap credentials not configured');
      }
      
      const transporter = nodemailer.createTransporter({
        host: settings.mailtrap_host,
        port: parseInt(settings.mailtrap_port),
        auth: {
          user: settings.mailtrap_user,
          pass: settings.mailtrap_pass,
        },
      });
      
      await transporter.sendMail({
        from: settings.mailtrap_from || config.from,
        to: config.to,
        subject: config.subject,
        html: config.html,
      });
      
      return true;
    } catch (error) {
      console.error('Mailtrap error:', error);
      return false;
    }
  }
}

// SendGrid Provider
class SendGridProvider implements EmailProvider {
  name = 'SendGrid';
  
  async sendEmail(config: EmailConfig): Promise<boolean> {
    try {
      const settings = await getEmailSettings();
      
      if (!settings.sendgrid_api_key) {
        throw new Error('SendGrid API key not configured');
      }
      
      sgMail.setApiKey(settings.sendgrid_api_key);
      
      await sgMail.send({
        to: config.to,
        from: settings.sendgrid_from || config.from,
        subject: config.subject,
        html: config.html,
      });
      
      return true;
    } catch (error) {
      console.error('SendGrid error:', error);
      return false;
    }
  }
}

// Gmail SMTP Provider
class GmailProvider implements EmailProvider {
  name = 'Gmail';
  
  async sendEmail(config: EmailConfig): Promise<boolean> {
    try {
      const settings = await getEmailSettings();
      
      if (!settings.gmail_email || !settings.gmail_password) {
        throw new Error('Gmail credentials not configured');
      }
      
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: settings.gmail_email,
          pass: settings.gmail_password, // App password
        },
      });
      
      await transporter.sendMail({
        from: settings.gmail_from || config.from,
        to: config.to,
        subject: config.subject,
        html: config.html,
      });
      
      return true;
    } catch (error) {
      console.error('Gmail error:', error);
      return false;
    }
  }
}

// Generic SMTP Provider
class SMTPProvider implements EmailProvider {
  name = 'SMTP';
  
  async sendEmail(config: EmailConfig): Promise<boolean> {
    try {
      const settings = await getEmailSettings();
      
      if (!settings.smtp_host) {
        throw new Error('SMTP_HOST is not configured');
      }
      
      const transporter = nodemailer.createTransporter({
        host: settings.smtp_host,
        port: parseInt(settings.smtp_port || '587'),
        secure: settings.smtp_secure === 'true',
        auth: {
          user: settings.smtp_user,
          pass: settings.smtp_pass,
        },
      });
      
      await transporter.sendMail({
        from: settings.smtp_from || config.from,
        to: config.to,
        subject: config.subject,
        html: config.html,
      });
      
      return true;
    } catch (error) {
      console.error('SMTP error:', error);
      return false;
    }
  }
}

// Email Service with fallback providers
class EmailService {
  private providers: EmailProvider[] = [
    new MailtrapProvider(), // Mailtrap as primary
    new SendGridProvider(),
    new GmailProvider(),
    new SMTPProvider(),
  ];
  
  async sendEmail(config: EmailConfig): Promise<{ success: boolean; provider?: string; error?: string }> {
    for (const provider of this.providers) {
      try {
        const success = await provider.sendEmail(config);
        if (success) {
          console.log(`Email sent successfully using ${provider.name}`);
          return { success: true, provider: provider.name };
        }
      } catch (error) {
        console.log(`${provider.name} failed, trying next provider...`);
        continue;
      }
    }
    
    return { 
      success: false, 
      error: 'All email providers failed. Please check your email configuration.' 
    };
  }
  
  async sendInvitationEmail(email: string, invitationToken: string, organizationId: string): Promise<boolean> {
    try {
      // For now, we'll use a simple invitation link format
      // In production, this would be your actual domain
      const invitationLink = `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/accept-invitation?token=${invitationToken}`;
      
      const emailHtml = this.generateInvitationEmail(
        "Tim Administrator", // In production, get actual inviter name
        "Platform OKR", // In production, get actual organization name
        invitationLink
      );
      
      const result = await this.sendEmail({
        from: "no-reply@platform-okr.com",
        to: email,
        subject: "Undangan Bergabung dengan Tim",
        html: emailHtml,
      });
      
      return result.success;
    } catch (error) {
      console.error("Error sending invitation email:", error);
      return false;
    }
  }

  generateInvitationEmail(inviterName: string, organizationName: string, invitationLink: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Undangan Tim - ${organizationName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ea580c 0%, #fb923c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: linear-gradient(135deg, #ea580c 0%, #fb923c 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Undangan Bergabung dengan Tim</h1>
          </div>
          <div class="content">
            <p>Halo!</p>
            <p><strong>${inviterName}</strong> mengundang Anda untuk bergabung dengan tim <strong>${organizationName}</strong> dalam platform manajemen goal kami.</p>
            
            <p>Dengan bergabung, Anda dapat:</p>
            <ul>
              <li>Berkolaborasi dalam menetapkan dan mencapai tujuan tim</li>
              <li>Melacak progress key results secara real-time</li>
              <li>Mengelola inisiatif dan tugas bersama</li>
              <li>Mendapatkan insights dan analytics mendalam</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${invitationLink}" class="button">Terima Undangan</a>
            </div>
            
            <p>Jika tombol di atas tidak berfungsi, Anda dapat menyalin dan menempel link berikut di browser:</p>
            <p style="background: #e9ecef; padding: 10px; border-radius: 5px; word-break: break-all;">${invitationLink}</p>
            
            <p>Undangan ini valid selama 7 hari. Jika Anda tidak mengenal ${inviterName} atau tidak ingin bergabung, Anda dapat mengabaikan email ini.</p>
          </div>
          <div class="footer">
            <p>Email ini dikirim secara otomatis oleh sistem. Jangan balas email ini.</p>
            <p>Jika Anda memiliki pertanyaan, hubungi administrator tim Anda.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();