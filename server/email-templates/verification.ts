export function generateVerificationEmail(userName: string, businessName: string, verificationCode: string, verificationLink: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Verifikasi Email - Platform OKR</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ea580c 0%, #fb923c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .code { background: #fff; border: 2px solid #ea580c; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; color: #ea580c; border-radius: 5px; margin: 20px 0; }
        .button { display: inline-block; background: linear-gradient(135deg, #ea580c 0%, #fb923c 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Verifikasi Email Anda</h1>
        </div>
        <div class="content">
          <p>Halo <strong>${userName}</strong>!</p>
          <p>Terima kasih telah mendaftar di Platform OKR untuk <strong>${businessName}</strong>.</p>
          
          <p>Untuk mengaktifkan akun Anda, silakan gunakan kode verifikasi berikut:</p>
          
          <div class="code">${verificationCode}</div>
          
          <p>Atau klik tombol di bawah untuk verifikasi otomatis:</p>
          
          <div style="text-align: center;">
            <a href="${verificationLink}" class="button">Verifikasi Email</a>
          </div>
          
          <p>Jika tombol di atas tidak berfungsi, Anda dapat menyalin dan menempel link berikut di browser:</p>
          <p style="background: #e9ecef; padding: 10px; border-radius: 5px; word-break: break-all;">${verificationLink}</p>
          
          <p>Kode verifikasi ini akan kedaluwarsa dalam 24 jam.</p>
          
          <p>Jika Anda tidak mendaftar untuk akun ini, silakan abaikan email ini.</p>
        </div>
        <div class="footer">
          <p>Email ini dikirim secara otomatis oleh sistem. Jangan balas email ini.</p>
          <p>© 2025 Platform OKR. Semua hak dilindungi.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateResendVerificationEmail(userName: string, verificationCode: string, verificationLink: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Kode Verifikasi Baru - Platform OKR</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ea580c 0%, #fb923c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .code { background: #fff; border: 2px solid #ea580c; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; color: #ea580c; border-radius: 5px; margin: 20px 0; }
        .button { display: inline-block; background: linear-gradient(135deg, #ea580c 0%, #fb923c 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Kode Verifikasi Baru</h1>
        </div>
        <div class="content">
          <p>Halo <strong>${userName}</strong>!</p>
          <p>Anda telah meminta kode verifikasi baru untuk akun Anda.</p>
          
          <p>Kode verifikasi baru Anda adalah:</p>
          
          <div class="code">${verificationCode}</div>
          
          <p>Atau klik tombol di bawah untuk verifikasi otomatis:</p>
          
          <div style="text-align: center;">
            <a href="${verificationLink}" class="button">Verifikasi Email</a>
          </div>
          
          <p>Kode verifikasi ini akan kedaluwarsa dalam 24 jam.</p>
          
          <p>Jika Anda tidak meminta kode verifikasi baru, silakan abaikan email ini.</p>
        </div>
        <div class="footer">
          <p>Email ini dikirim secara otomatis oleh sistem. Jangan balas email ini.</p>
          <p>© 2025 Platform OKR. Semua hak dilindungi.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}