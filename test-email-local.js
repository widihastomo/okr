// Test email functionality in local development
import nodemailer from 'nodemailer';

console.log('🧪 Testing email configuration for local development...');

// Test Mailtrap configuration
const mailtrapConfig = {
  host: 'sandbox.smtp.mailtrap.io',
  port: 2525,
  auth: {
    user: 'deb40b3a0b567f',
    pass: '1a8d3f2b2e7c39'
  }
};

console.log('\n📧 Testing Mailtrap connection...');
const transporter = nodemailer.createTransport(mailtrapConfig);

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Mailtrap connection failed:', error.message);
    console.log('\n💡 Solutions:');
    console.log('1. Check your internet connection');
    console.log('2. Verify Mailtrap credentials in .env file');
    console.log('3. Make sure Mailtrap service is available');
  } else {
    console.log('✅ Mailtrap connection successful!');
    console.log('\n🔄 Sending test email...');
    
    // Send test email
    const mailOptions = {
      from: 'noreply@okrapp.com',
      to: 'test@example.com',
      subject: 'Test Email from Local Development',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from your local development environment.</p>
        <p>If you see this in your Mailtrap inbox, email is working correctly!</p>
      `
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('❌ Email sending failed:', error.message);
      } else {
        console.log('✅ Test email sent successfully!');
        console.log('📬 Check your Mailtrap inbox to see the email');
        console.log('🔗 Mailtrap URL: https://mailtrap.io/inboxes');
      }
    });
  }
});