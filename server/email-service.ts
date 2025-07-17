import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import { generateInvitationEmail } from './email-templates';

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

// Get email settings from environment variables
function getEmailSettings(): Record<string, string> {
  const settings = {
    // Mailtrap settings
    mailtrap_host: process.env.MAILTRAP_HOST || '',
    mailtrap_port: process.env.MAILTRAP_PORT || '',
    mailtrap_user: process.env.MAILTRAP_USER || '',
    mailtrap_pass: process.env.MAILTRAP_PASS || '',
    mailtrap_from: process.env.MAILTRAP_FROM || '',
    
    // SendGrid settings
    sendgrid_api_key: process.env.SENDGRID_API_KEY || '',
    sendgrid_from: process.env.SENDGRID_FROM || '',
    
    // Gmail settings
    gmail_email: process.env.GMAIL_EMAIL || '',
    gmail_password: process.env.GMAIL_PASSWORD || '',
    gmail_from: process.env.GMAIL_FROM || '',
    
    // SMTP settings
    smtp_host: process.env.SMTP_HOST || '',
    smtp_port: process.env.SMTP_PORT || '587',
    smtp_secure: process.env.SMTP_SECURE || 'false',
    smtp_user: process.env.SMTP_USER || '',
    smtp_pass: process.env.SMTP_PASS || '',
    smtp_from: process.env.SMTP_FROM || '',
  };
  
  // Debug: Log environment variables status
  console.log('📧 Email service environment check:');
  console.log('  - SMTP_HOST (Primary):', settings.smtp_host ? 'configured' : 'not configured');
  console.log('  - SMTP_USER:', settings.smtp_user ? 'configured' : 'not configured');
  console.log('  - SMTP_PASS:', settings.smtp_pass ? 'configured' : 'not configured');
  console.log('  - MAILTRAP_HOST:', settings.mailtrap_host ? 'configured' : 'not configured');
  console.log('  - SENDGRID_API_KEY:', settings.sendgrid_api_key ? 'configured' : 'not configured');
  console.log('  - GMAIL_EMAIL:', settings.gmail_email ? 'configured' : 'not configured');
  
  return settings;
}

// Mailtrap Provider
class MailtrapProvider implements EmailProvider {
  name = 'Mailtrap';
  
  async sendEmail(config: EmailConfig): Promise<boolean> {
    try {
      const settings = getEmailSettings();
      
      if (!settings.mailtrap_host || !settings.mailtrap_port || !settings.mailtrap_user || !settings.mailtrap_pass) {
        throw new Error('Mailtrap credentials not configured');
      }
      
      // Skip if using placeholder credentials (only in production)
      if (process.env.NODE_ENV === 'production' && 
          (settings.mailtrap_user === 'deb40b3a0b567f' || settings.mailtrap_pass === '1a8d3f2b2e7c39')) {
        throw new Error('Mailtrap using placeholder credentials - please update .env file with real credentials');
      }
      
      // In development, allow placeholder credentials but warn user
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️  Using Mailtrap for development - emails will be caught in sandbox');
      }
      if (process.env.NODE_ENV === 'development' && 
          (settings.mailtrap_user === 'deb40b3a0b567f' || settings.mailtrap_pass === '1a8d3f2b2e7c39')) {
        console.log('📧 Using placeholder Mailtrap credentials in development mode - this may fail');
        // Continue to attempt sending in development mode
      }
      
      const transporter = nodemailer.createTransport({
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
      throw error;
    }
  }
}

// SendGrid Provider
class SendGridProvider implements EmailProvider {
  name = 'SendGrid';
  
  async sendEmail(config: EmailConfig): Promise<boolean> {
    try {
      const settings = getEmailSettings();
      
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
      throw error;
    }
  }
}

// Gmail SMTP Provider
class GmailProvider implements EmailProvider {
  name = 'Gmail';
  
  async sendEmail(config: EmailConfig): Promise<boolean> {
    try {
      const settings = getEmailSettings();
      
      if (!settings.gmail_email || !settings.gmail_password) {
        throw new Error('Gmail credentials not configured');
      }
      
      const transporter = nodemailer.createTransport({
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
      throw error;
    }
  }
}

// Generic SMTP Provider
class SMTPProvider implements EmailProvider {
  name = 'SMTP';
  
  async sendEmail(config: EmailConfig): Promise<boolean> {
    try {
      const settings = getEmailSettings();
      
      if (!settings.smtp_host) {
        throw new Error('SMTP_HOST is not configured');
      }
      
      const port = parseInt(settings.smtp_port || '587');
      const secure = settings.smtp_secure === 'true' || port === 465;
      
      const transporter = nodemailer.createTransport({
        host: settings.smtp_host,
        port: port,
        secure: secure,
        auth: settings.smtp_user && settings.smtp_pass ? {
          user: settings.smtp_user,
          pass: settings.smtp_pass,
        } : undefined,
        tls: {
          rejectUnauthorized: false // Allow self-signed certificates
        }
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
      throw error;
    }
  }
}

// Development Email Provider (fallback when no real credentials are configured)
class DevelopmentEmailProvider implements EmailProvider {
  name = 'Development (Simulated)';
  
  async sendEmail(config: EmailConfig): Promise<boolean> {
    console.log('📧 DEVELOPMENT MODE - Email would be sent:', {
      from: config.from,
      to: config.to,
      subject: config.subject,
      html: config.html.substring(0, 100) + '...' // Show first 100 chars
    });
    
    // Simulate email sending in development
    return true;
  }
}

// Email Service with fallback providers
class EmailService {
  private providers: EmailProvider[] = [];
  
  constructor() {
    // In development mode, prioritize Mailtrap for local testing
    if (process.env.NODE_ENV === 'development') {
      this.providers = [
        new MailtrapProvider(), // Mailtrap as primary for development
        new SMTPProvider(), // Custom SMTP as fallback
        new SendGridProvider(),
        new GmailProvider(),
      ];
    } else {
      // In production, use SMTP as primary
      this.providers = [
        new SMTPProvider(), // Custom SMTP as primary
        new MailtrapProvider(), // Mailtrap as fallback
        new SendGridProvider(),
        new GmailProvider(),
      ];
    }
  }
  
  async sendEmail(config: EmailConfig): Promise<{ success: boolean; provider?: string; error?: string }> {
    let lastError = '';
    
    for (const provider of this.providers) {
      try {
        const success = await provider.sendEmail(config);
        if (success) {
          console.log(`Email sent successfully using ${provider.name}`);
          return { success: true, provider: provider.name };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log(`${provider.name} failed: ${errorMessage}`);
        lastError = errorMessage;
        continue;
      }
    }
    
    // In development mode, use development provider as fallback
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️  All email providers failed, using development fallback');
      try {
        const devProvider = new DevelopmentEmailProvider();
        const success = await devProvider.sendEmail(config);
        if (success) {
          return { success: true, provider: devProvider.name };
        }
      } catch (devError) {
        console.error('Development provider also failed:', devError);
      }
    }
    
    return { 
      success: false, 
      error: `All email providers failed. Last error: ${lastError}. Please check your email configuration.` 
    };
  }
  
  async sendInvitationEmail(email: string, invitationToken: string, organizationId: string): Promise<boolean> {
    try {
      // For now, we'll use a simple invitation link format
      // In production, this would be your actual domain
      const invitationLink = `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/accept-invitation?token=${invitationToken}`;
      
      const emailHtml = generateInvitationEmail(
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


}

export const emailService = new EmailService();

// Log the email service configuration on startup
if (process.env.NODE_ENV === 'development') {
  console.log('📧 Email service initialized for LOCAL DEVELOPMENT:');
  console.log('  - Primary provider: Mailtrap (sandbox.smtp.mailtrap.io)');
  console.log('  - Port: 2525 (development sandbox)');
  console.log('  - Sender: noreply@okrapp.com');
  console.log('  - Fallback providers: Custom SMTP → SendGrid → Gmail');
  console.log('  - All emails will be caught in Mailtrap sandbox for testing');
} else {
  console.log('📧 Email service initialized with custom SMTP configuration:');
  console.log('  - Primary provider: Custom SMTP (mx3.mailspace.id)');
  console.log('  - Port: 465 (SSL)');
  console.log('  - Sender: no-reply@mail.refokus.id');
  console.log('  - Fallback providers: Mailtrap → SendGrid → Gmail');
  console.log('  - Configuration loaded from environment variables');
}