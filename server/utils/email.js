const nodemailer = require('nodemailer');

// Initialize Transporter using SMTP settings from environment variables if present
// Otherwise, configure a mock local transporter that logs emails to console for local testing
const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    console.log(`Email Service: SMTP configured with host: ${host}:${port}`);
    return nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465, // true for 465, false for other ports
      auth: {
        user,
        pass
      }
    });
  } else {
    // Local development mock transporter
    console.log('Email Service: SMTP credentials missing. Falling back to local console mock.');
    return {
      sendMail: async (mailOptions) => {
        console.log('\n=================== MOCK EMAIL SENT ===================');
        console.log(`To:      ${mailOptions.to}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log('------------------ HTML BODY CONTENT ------------------');
        // Extract a clean version of html text for readability
        const cleanText = mailOptions.html.replace(/<[^>]*>/g, '\n').replace(/\n\s*\n/g, '\n');
        console.log(cleanText.trim());
        console.log('=======================================================\n');
        return { messageId: 'mock-id-12345' };
      }
    };
  }
};

const transporter = getTransporter();

/**
 * Send booking confirmation email to customer
 * @param {Object} appointment Mongoose Appointment document
 * @param {Object} customer User document of the client
 * @param {Object} barber User document of the barber
 */
const sendBookingConfirmation = async (appointment, customer, barber) => {
  try {
    const dateFormatted = new Date(appointment.startTime).toLocaleDateString([], {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    
    // Format UTC Time nicely
    const timeFormatted = new Date(appointment.startTime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Hair Studio" <noreply@hairstudio.com>',
      to: customer.email,
      subject: `Booking Confirmed: ${appointment.service.name} at Hair Studio`,
      html: `
        <div style="font-family: 'Outfit', 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid rgba(140, 133, 123, 0.3); border-radius: 12px; background-color: #fcfbfa; color: #111111;">
          <div style="text-align: center; border-bottom: 1px solid rgba(140, 133, 123, 0.2); padding-bottom: 20px; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 26px; font-weight: 900; tracking-tight: -1px; text-transform: uppercase; color: #111111; line-height: 1;">HAIR</h1>
            <div style="font-size: 10px; font-weight: 600; tracking-top: -1px; letter-spacing: 3px; color: #f37023; text-transform: uppercase; margin-top: 2px;">STUDIO</div>
            <p style="margin: 15px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #8c857b; font-weight: 700;">Booking Confirmed</p>
          </div>
          
          <p style="font-size: 14px; line-height: 1.5; color: #111111;">Hello <strong>${customer.name}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.5; color: #8c857b;">Your appointment has been successfully booked and secured. Here are your reservation details:</p>
          
          <div style="background-color: #ffffff; border: 1px solid rgba(140, 133, 123, 0.25); border-radius: 8px; padding: 20px; margin: 24px 0; font-size: 14px; line-height: 1.6; box-shadow: 0 4px 12px rgba(140, 133, 123, 0.03);">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(140, 133, 123, 0.15); padding-bottom: 10px; margin-bottom: 10px;">
              <span style="color: #8c857b;">Stylist:</span>
              <strong style="color: #111111;">${barber.name}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(140, 133, 123, 0.15); padding-bottom: 10px; margin-bottom: 10px;">
              <span style="color: #8c857b;">Service:</span>
              <strong style="color: #111111;">${appointment.service.name} (${appointment.service.duration} mins)</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(140, 133, 123, 0.15); padding-bottom: 10px; margin-bottom: 10px;">
              <span style="color: #8c857b;">Date:</span>
              <strong style="color: #111111;">${dateFormatted}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(140, 133, 123, 0.15); padding-bottom: 10px; margin-bottom: 10px;">
              <span style="color: #8c857b;">Time:</span>
              <strong style="color: #111111;">${timeFormatted}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding-top: 6px;">
              <span style="color: #8c857b;">Rate:</span>
              <strong style="color: #f37023; font-size: 18px;">₹${appointment.service.price}</strong>
            </div>
          </div>
          
          <p style="font-size: 12px; color: #8c857b; line-height: 1.5; margin-top: 30px; text-align: center; font-style: italic;">
            Note: If you need to cancel, please do so via your personal booking log up to 2 hours before the schedule.
          </p>
          
          <div style="text-align: center; border-top: 1px solid rgba(140, 133, 123, 0.2); padding-top: 20px; margin-top: 30px; font-size: 11px; color: #8c857b; letter-spacing: 0.5px;">
            © 2026 Hair Studio • Premium Grooming & Hair Artistry
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Booking confirmation email sent to ${customer.email}. Message ID: ${info.messageId}`);
  } catch (err) {
    console.error('Error dispatching booking confirmation email:', err);
  }
};

module.exports = { sendBookingConfirmation };
