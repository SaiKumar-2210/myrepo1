const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }
    return transporter;
}

/**
 * Send caregiver alert email when a dose is missed
 */
async function sendCaregiverAlert(caregiverEmail, userName, medicineName, scheduledTime) {
    if (!caregiverEmail || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('⚠️  Email not configured or no caregiver email set. Skipping alert.');
        return false;
    }

    try {
        const mail = getTransporter();
        await mail.sendMail({
            from: `"MedBs Alert" <${process.env.EMAIL_USER}>`,
            to: caregiverEmail,
            subject: `⚠️ Missed Dose Alert — ${userName}`,
            html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background: #fef3cd; border-radius: 12px; border: 1px solid #ffc107;">
          <h2 style="color: #856404; margin: 0 0 16px;">⚠️ Missed Dose Alert</h2>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            <strong>${userName}</strong> missed their scheduled dose:
          </p>
          <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Medicine:</strong> ${medicineName}</p>
            <p style="margin: 4px 0;"><strong>Scheduled Time:</strong> ${scheduledTime}</p>
            <p style="margin: 4px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          <p style="color: #666; font-size: 14px;">
            Please check in with them to ensure they take their medication.
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 16px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            Sent by MedBs — Medication Adherence Assistant
          </p>
        </div>
      `
        });
        console.log(`📧 Caregiver alert sent to ${caregiverEmail}`);
        return true;
    } catch (error) {
        console.error('Email send error:', error.message);
        return false;
    }
}

/**
 * Send reminder email to user
 */
async function sendReminderEmail(userEmail, medicineName, dosage, time) {
    if (!userEmail || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        return false;
    }

    try {
        const mail = getTransporter();
        await mail.sendMail({
            from: `"MedBs Reminder" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: `💊 Time to take ${medicineName}`,
            html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background: #d4edda; border-radius: 12px; border: 1px solid #28a745;">
          <h2 style="color: #155724; margin: 0 0 16px;">💊 Medication Reminder</h2>
          <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 4px 0; font-size: 18px;"><strong>${medicineName}</strong></p>
            <p style="margin: 4px 0; color: #666;">Dosage: ${dosage}</p>
            <p style="margin: 4px 0; color: #666;">Scheduled: ${time}</p>
          </div>
          <p style="color: #333;">Don't forget to log your dose in the app!</p>
        </div>
      `
        });
        return true;
    } catch (error) {
        console.error('Reminder email error:', error.message);
        return false;
    }
}

module.exports = { sendCaregiverAlert, sendReminderEmail };
