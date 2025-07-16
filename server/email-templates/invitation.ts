export function generateInvitationEmail(
  inviterName: string,
  organizationName: string,
  invitationLink: string,
): string {
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
          <p><strong>${inviterName}</strong> mengundang Anda untuk bergabung dengan tim <strong>${organizationName}</strong> dalam platform manajemen strategi - Refokus.</p>
          
          <p>Dengan bergabung, Anda dapat:</p>
          <ul>
            <li>Berkolaborasi dalam menetapkan dan mencapai tujuan tim</li>
            <li>Melacak capaian progress secara real-time</li>
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
          <p>© 2025 Refokus. Semua hak dilindungi.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
