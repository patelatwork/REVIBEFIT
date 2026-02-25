import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  // Check if email configuration is available
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email configuration missing. Please check your environment variables.');
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Send approval email to trainer or lab partner
export const sendApprovalEmail = async (user) => {
  try {
    // Check if we have necessary email configuration
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email configuration not found, skipping approval email');
      return { success: true, skipped: true, message: 'Email configuration not available' };
    }

    const transporter = createTransporter();

    const userTypeDisplay = user.userType === 'trainer' ? 'Trainer' : 'Lab Partner';

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'RevibeFit'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `Welcome to RevibeFit - Your ${userTypeDisplay} Account Has Been Approved! 🎉`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
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
              background: linear-gradient(135deg, #225533 0%, #3f8554 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #666;
              font-size: 12px;
            }
            .info-box {
              background: white;
              padding: 15px;
              border-left: 4px solid #3f8554;
              margin: 15px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Congratulations!</h1>
            <p>Your account has been approved</p>
          </div>
          <div class="content">
            <h2>Welcome to RevibeFit, ${user.name}!</h2>
            <p>We're excited to inform you that your ${userTypeDisplay} account has been approved by our admin team.</p>
            
            <div class="info-box">
              <strong>What's Next?</strong>
              <ul>
                <li>Log in to your account using your credentials</li>
                ${user.userType === 'trainer' ? 
                  '<li>Start creating live fitness classes</li><li>Connect with fitness enthusiasts</li><li>Track your earnings and class schedules</li>' : 
                  '<li>Add your lab tests and services</li><li>Manage bookings and appointments</li><li>Track your revenue and commissions</li>'
                }
              </ul>
            </div>

            <p><strong>Your Account Details:</strong></p>
            <div class="info-box">
              <p><strong>Email:</strong> ${user.email}</p>
              <p><strong>Account Type:</strong> ${userTypeDisplay}</p>
              ${user.userType === 'trainer' ? `<p><strong>Specialization:</strong> ${user.specialization || 'N/A'}</p>` : ''}
              ${user.userType === 'lab-partner' ? `<p><strong>Laboratory:</strong> ${user.laboratoryName || 'N/A'}</p>` : ''}
            </div>

            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>

            <p>Best regards,<br><strong>The RevibeFit Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated message from RevibeFit. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} RevibeFit. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Congratulations ${user.name}!

        Your ${userTypeDisplay} account has been approved and you can now start using the RevibeFit platform.

        Account Details:
        - Email: ${user.email}
        - Account Type: ${userTypeDisplay}
        ${user.userType === 'trainer' ? `- Specialization: ${user.specialization || 'N/A'}` : ''}
        ${user.userType === 'lab-partner' ? `- Laboratory: ${user.laboratoryName || 'N/A'}` : ''}

        Log in to the platform to get started!

        Best regards,
        The RevibeFit Team
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Approval email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending approval email:', error);
    return { success: false, error: error.message };
  }
};

// Send rejection email
export const sendRejectionEmail = async (user, reason) => {
  try {
    // Check if we have necessary email configuration
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email configuration not found, skipping rejection email');
      return { success: true, skipped: true, message: 'Email configuration not available' };
    }

    const transporter = createTransporter();

    const userTypeDisplay = user.userType === 'trainer' ? 'Trainer' : 'Lab Partner';

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'RevibeFit'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `RevibeFit - ${userTypeDisplay} Application Status`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
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
              background: #dc3545;
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .info-box {
              background: white;
              padding: 15px;
              border-left: 4px solid #dc3545;
              margin: 15px 0;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Application Status Update</h1>
          </div>
          <div class="content">
            <h2>Dear ${user.name},</h2>
            <p>Thank you for your interest in joining RevibeFit as a ${userTypeDisplay}.</p>
            
            <p>After careful review, we regret to inform you that we are unable to approve your application at this time.</p>

            ${reason ? `
              <div class="info-box">
                <strong>Reason:</strong>
                <p>${reason}</p>
              </div>
            ` : ''}

            <p>If you believe this decision was made in error or if you would like to reapply in the future, please contact our support team.</p>

            <p>Thank you for your understanding.</p>

            <p>Best regards,<br><strong>The RevibeFit Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} RevibeFit. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Rejection email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending rejection email:', error);
    return { success: false, error: error.message };
  }
};