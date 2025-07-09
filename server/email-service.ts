import nodemailer from 'nodemailer';

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

// SendGrid Provider
class SendGridProvider implements EmailProvider {
  name = 'SendGrid';
  
  async sendEmail(config: EmailConfig): Promise<boolean> {
    try {
      // For development, we'll simulate email sending
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Development Mode - Email would be sent to:', config.to);
        console.log('📧 Subject:', config.subject);
        console.log('📧 HTML content length:', config.html.length);
        return true;
      }
      
      const sgMail = (await import('@sendgrid/mail')).default;
      
      if (!process.env.SENDGRID_API_KEY) {
        throw new Error('SENDGRID_API_KEY is not configured');
      }
      
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      
      await sgMail.send({
        to: config.to,
        from: config.from,
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
      if (!process.env.GMAIL_EMAIL || !process.env.GMAIL_PASSWORD) {
        throw new Error('Gmail credentials not configured');
      }
      
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_EMAIL,
          pass: process.env.GMAIL_PASSWORD, // App password
        },
      });
      
      await transporter.sendMail({
        from: config.from,
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
      const requiredEnvs = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
      for (const env of requiredEnvs) {
        if (!process.env[env]) {
          throw new Error(`${env} is not configured`);
        }
      }
      
      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      
      await transporter.sendMail({
        from: config.from,
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

  async sendVerificationEmail(email: string, verificationCode: string, userName: string): Promise<boolean> {
    try {
      const emailHtml = this.generateVerificationEmail(userName, verificationCode);
      
      const result = await this.sendEmail({
        from: "no-reply@platform-okr.com",
        to: email,
        subject: "Kode Verifikasi Registrasi - Platform OKR",
        html: emailHtml,
      });
      
      return result.success;
    } catch (error) {
      console.error("Error sending verification email:", error);
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

  generateVerificationEmail(userName: string, verificationCode: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Kode Verifikasi Registrasi - Platform OKR</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ea580c 0%, #fb923c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .verification-code { background: #fff; border: 2px solid #ea580c; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0; }
          .code { font-size: 32px; font-weight: bold; color: #ea580c; letter-spacing: 8px; font-family: monospace; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verifikasi Email Registrasi</h1>
          </div>
          <div class="content">
            <p>Halo <strong>${userName}</strong>!</p>
            
            <p>Terima kasih telah mendaftar di Platform OKR. Untuk menyelesaikan registrasi Anda, silakan gunakan kode verifikasi berikut:</p>
            
            <div class="verification-code">
              <div class="code">${verificationCode}</div>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Kode verifikasi 6 digit</p>
            </div>
            
            <p><strong>Penting:</strong></p>
            <ul>
              <li>Kode ini hanya valid selama 5 menit</li>
              <li>Jangan bagikan kode ini kepada siapa pun</li>
              <li>Masukkan kode ini di halaman verifikasi registrasi</li>
            </ul>
            
            <p>Jika Anda tidak melakukan registrasi, silakan abaikan email ini.</p>
            
            <p>Selamat datang di platform manajemen goal yang akan membantu Anda mencapai tujuan bisnis!</p>
          </div>
          <div class="footer">
            <p>Email ini dikirim secara otomatis oleh sistem. Jangan balas email ini.</p>
            <p>Jika Anda memiliki pertanyaan, hubungi tim support kami.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();