const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT == 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendEmail(to, subject, text, html = null, attachments = []) {
    try {
      const mailOptions = {
        from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
        to,
        subject,
        text,
        html,
        attachments
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email sent to ${to}: ${subject}`);
      return result;
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      throw error;
    }
  }

  async sendVerificationEmail(to, name, verificationToken) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const subject = 'Verify your email address - Eventify';
    const text = `Hello ${name},\n\nPlease verify your email by clicking the link below:\n${verificationUrl}\n\nThis link expires in 24 hours.\n\nBest regards,\nEventify Team`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Eventify</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Event Management Made Easy</p>
        </div>
        <div style="padding: 40px 20px; background: #f8f9fa;">
          <h2 style="color: #333;">Welcome, ${name}!</h2>
          <p style="color: #666; line-height: 1.6;">
            Thank you for registering with Eventify. Please verify your email address to activate your account.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}"
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
              Verify Email
            </a>
          </div>
          <p style="color: #999; font-size: 14px;">
            Or copy and paste this link in your browser:<br>
            <small>${verificationUrl}</small>
          </p>
          <p style="color: #999; font-size: 14px;">
            This link will expire in 24 hours.
          </p>
        </div>
        <div style="background: #333; color: #ccc; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Eventify. All rights reserved.</p>
          <p style="margin: 10px 0 0 0;">
            <a href="#" style="color: #667eea; text-decoration: none;">Unsubscribe</a>
          </p>
        </div>
      </div>
    `;

    return this.sendEmail(to, subject, text, html);
  }

  async sendPasswordResetEmail(to, name, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const subject = 'Reset your password - Eventify';
    const text = `Hello ${name},\n\nYou requested to reset your password. Click the link below to set a new password:\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nEventify Team`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Eventify</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Password Reset</p>
        </div>
        <div style="padding: 40px 20px; background: #f8f9fa;">
          <h2 style="color: #333;">Hello, ${name}!</h2>
          <p style="color: #666; line-height: 1.6;">
            We received a request to reset your password. Click the button below to create a new password.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}"
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #999; font-size: 14px;">
            Or copy and paste this link in your browser:<br>
            <small>${resetUrl}</small>
          </p>
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            ⚠️ This link will expire in 1 hour.
          </p>
          <p style="color: #999; font-size: 14px;">
            If you didn't request a password reset, please ignore this email and your password will remain unchanged.
          </p>
        </div>
        <div style="background: #333; color: #ccc; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Eventify. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendEmail(to, subject, text, html);
  }

  async sendBookingConfirmationEmail(to, customerName, booking) {
    const subject = `Booking Confirmed! - Eventify - Booking #${booking.bookingId}`;
    const eventName = booking.event ? booking.event.name : 'Event';

    const text = `Hello ${customerName},\n\nCongratulations! Your booking for ${eventName} has been confirmed.\n\nBooking ID: ${booking.bookingId}\nEvent Date: ${new Date(booking.eventDetails.date).toLocaleDateString()}\nTotal Amount: ₹${booking.pricing.totalAmount}\n\nPlease check your dashboard for more details.\n\nBest regards,\nEventify Team`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">🎉 Booking Confirmed!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Eventify</p>
        </div>
        <div style="padding: 40px 20px; background: #f8f9fa;">
          <h2 style="color: #333;">Hello, ${customerName}!</h2>
          <p style="color: #666; line-height: 1.6;">
            Great news! Your booking has been confirmed. Here are your booking details:
          </p>
          <div style="background: white; padding: 25px; border-radius: 10px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h3 style="color: #667eea; margin-top: 0;">${eventName}</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Booking ID:</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333;">${booking.bookingId}</td></tr>
              <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Event Date:</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333;">${new Date(booking.eventDetails.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
              <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Venue:</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333;">${booking.eventDetails.venue.name}</td></tr>
              <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Expected Guests:</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333;">${booking.eventDetails.expectedGuests}</td></tr>
              <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Package:</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333;">${booking.event.packageName}</td></tr>
              <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Total Amount:</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333; font-weight: bold;">₹${booking.pricing.totalAmount.toLocaleString('en-IN')}</td></tr>
              <tr><td style="padding: 10px 0; color: #666;"><strong>Payment Status:</strong></td><td style="padding: 10px 0; color: #333; text-transform: capitalize;">${booking.payment.status}</td></tr>
            </table>
          </div>
          <div style="background: #e8f4fd; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0;">
            <strong>📱 Next Steps:</strong>
            <ul style="margin: 10px 0 0 20px;">
              <li>Track your event progress in the dashboard</li>
              <li>You'll receive updates via email/SMS</li>
              <li>Contact your event manager for any special requests</li>
            </ul>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/bookings/${booking._id}"
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
              View Booking Details
            </a>
          </div>
        </div>
        <div style="background: #333; color: #ccc; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Eventify. All rights reserved.</p>
          <p style="margin: 10px 0 0 0;">
            123 Event Street, Mumbai, Maharashtra 400001
          </p>
        </div>
      </div>
    `;

    return this.sendEmail(to, subject, text, html);
  }

  async sendPaymentReceiptEmail(to, customerName, payment, booking) {
    const subject = `Payment Receipt - Eventify - Transaction #${payment.transactionId}`;
    const eventName = booking.event ? booking.event.name : 'Event';

    const text = `Hello ${customerName},\n\nYour payment has been received successfully.\n\nTransaction ID: ${payment.transactionId}\nBooking ID: ${booking.bookingId}\nAmount Paid: ₹${payment.amount}\nPayment Method: ${payment.method}\n\nThank you for your payment!\n\nBest regards,\nEventify Team`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">💰 Payment Receipt</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Eventify</p>
        </div>
        <div style="padding: 40px 20px; background: #f8f9fa;">
          <h2 style="color: #333;">Hello, ${customerName}!</h2>
          <p style="color: #666; line-height: 1.6;">
            Thank you for your payment. Here is your receipt:
          </p>
          <div style="background: white; padding: 25px; border-radius: 10px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h3 style="color: #28a745; border-bottom: 2px solid #28a745; padding-bottom: 10px; margin-top: 0;">
              ✓ Payment Successful
            </h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 10px 0; color: #666;"><strong>Transaction ID:</strong></td><td style="padding: 10px 0; color: #333; font-family: monospace;">${payment.transactionId}</td></tr>
              <tr><td style="padding: 10px 0; color: #666;"><strong>Booking ID:</strong></td><td style="padding: 10px 0; color: #333;">${booking.bookingId}</td></tr>
              <tr><td style="padding: 10px 0; color: #666;"><strong>Event:</strong></td><td style="padding: 10px 0; color: #333;">${eventName}</td></tr>
              <tr><td style="padding: 10px 0; color: #666;"><strong>Amount Paid:</strong></td><td style="padding: 10px 0; color: #333; font-size: 18px; font-weight: bold;">₹${payment.amount.toLocaleString('en-IN')}</td></tr>
              <tr><td style="padding: 10px 0; color: #666;"><strong>Payment Method:</strong></td><td style="padding: 10px 0; color: #333; text-transform: capitalize;">${payment.method}</td></tr>
              <tr><td style="padding: 10px 0; color: #666;"><strong>Payment Date:</strong></td><td style="padding: 10px 0; color: #333;">${new Date().toLocaleString('en-IN')}</td></tr>
              <tr><td style="padding: 10px 0; color: #666;"><strong>Status:</strong></td><td style="padding: 10px 0; color: #28a745; font-weight: bold;">Success</td></tr>
            </table>
          </div>
          <p style="color: #999; font-size: 14px;">
            A copy of this receipt has been saved to your account. You can download it anytime from your payment history.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/payment-history"
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
              View Payment History
            </a>
          </div>
        </div>
        <div style="background: #333; color: #ccc; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Eventify. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendEmail(to, subject, text, html);
  }

  async sendTaskAssignmentEmail(to, employeeName, task, assignedBy) {
    const subject = `New Task Assigned - Eventify - Task #${task.taskId}`;

    const text = `Hello ${employeeName},\n\nA new task has been assigned to you.\n\nTask: ${task.title}\nPriority: ${task.priority}\nDeadline: ${new Date(task.deadline).toLocaleDateString()}\nAssigned by: ${assignedBy}\n\nPlease check your dashboard for more details.\n\nBest regards,\nEventify Team`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">📋 New Task Assigned</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Eventify</p>
        </div>
        <div style="padding: 40px 20px; background: #f8f9fa;">
          <h2 style="color: #333;">Hello, ${employeeName}!</h2>
          <p style="color: #666; line-height: 1.6;">
            You have been assigned a new task:
          </p>
          <div style="background: white; padding: 25px; border-radius: 10px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h3 style="color: #333; margin-top: 0;">${task.title}</h3>
            <p style="color: #666; line-height: 1.6;">${task.description.substring(0, 300)}${task.description.length > 300 ? '...' : ''}</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr><td style="padding: 8px 0; color: #666;"><strong>Task ID:</strong></td><td style="padding: 8px 0; color: #333;">${task.taskId}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;"><strong>Priority:</strong></td><td style="padding: 8px 0; color: #333; text-transform: capitalize;"><span style="background: ${
                task.priority === 'urgent' ? '#dc3545' :
                task.priority === 'high' ? '#fd7e14' :
                task.priority === 'medium' ? '#ffc107' : '#28a745'
              }; color: white; padding: 3px 10px; border-radius: 12px; font-size: 12px;">${task.priority}</span></td></tr>
              <tr><td style="padding: 8px 0; color: #666;"><strong>Deadline:</strong></td><td style="padding: 8px 0; color: #333;">${new Date(task.deadline).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;"><strong>Assigned By:</strong></td><td style="padding: 8px 0; color: #333;">${assignedBy}</td></tr>
            </table>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/tasks/${task._id}"
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
              View Task Details
            </a>
          </div>
        </div>
        <div style="background: #333; color: #ccc; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Eventify. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendEmail(to, subject, text, html);
  }
}

module.exports = new EmailService();
