export function generatePasswordResetEmail(
  userName: string,
  resetCode: string,
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Password - Platform OKR</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .code { background: #fff; border: 2px solid #2563eb; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; color: #2563eb; border-radius: 5px; margin: 20px 0; }
        .button { display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Reset Password</h1>
        </div>
        <div class="content">
          <p>Halo <strong>${userName}</strong>!</p>
          <p>Anda telah meminta reset password untuk akun Anda.</p>
          
          <p>Kode reset password Anda adalah:</p>
          
          <div class="code">${resetCode}</div>
          
          <p>Masukkan kode ini di halaman reset password untuk membuat password baru.</p>
          
          <p>Kode ini akan kedaluwarsa dalam 1 jam.</p>
          
          <p>Jika Anda tidak meminta reset password, silakan abaikan email ini.</p>
        </div>
        <div class="footer">
          <p>Email ini dikirim secara otomatis oleh sistem. Jangan balas email ini.</p>
          <p>© 2025 Refokus. Semua hak dilindungi.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
