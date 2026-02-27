const cron = require('node-cron');
const webpush = require('web-push');
const Medicine = require('../models/Medicine');
const AdherenceLog = require('../models/AdherenceLog');
const User = require('../models/User');
const { sendCaregiverAlert } = require('./email');

// Configure web-push securely
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:admin@medbs.local',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

/**
 * Start the reminder scheduler
 * Runs every minute to check for upcoming reminders and missed doses
 */
function startScheduler() {
    console.log('⏰ Reminder scheduler started');

    // Check every minute for reminders
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            const todayStart = new Date(now);
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date(now);
            todayEnd.setHours(23, 59, 59, 999);

            // Find active medicines with a timing matching current time
            const medicines = await Medicine.find({
                active: true,
                timing: currentTime,
                startDate: { $lte: now },
                $or: [
                    { endDate: { $exists: false } },
                    { endDate: null },
                    { endDate: { $gte: now } }
                ]
            });

            for (const medicine of medicines) {
                // Check if log already exists for this dose today
                const existingLog = await AdherenceLog.findOne({
                    medicineId: medicine._id,
                    userId: medicine.userId,
                    scheduledTime: currentTime,
                    date: { $gte: todayStart, $lte: todayEnd }
                });

                if (!existingLog) {
                    // Create a pending adherence log
                    await AdherenceLog.create({
                        medicineId: medicine._id,
                        userId: medicine.userId,
                        date: now,
                        scheduledTime: currentTime,
                        taken: false
                    });
                    console.log(`📋 Created reminder: ${medicine.name} at ${currentTime}`);

                    // Safely dispatch push notification if user is subscribed
                    const user = await User.findById(medicine.userId);
                    if (user && user.pushSubscription) {
                        try {
                            const payload = JSON.stringify({
                                title: 'Time for your Medicine! 💊',
                                body: `It's time to take ${medicine.dosage} of ${medicine.name}.`
                            });
                            await webpush.sendNotification(user.pushSubscription, payload);
                            console.log(`🔔 Sent push notification to ${user.name}`);
                        } catch (err) {
                            console.error('Push notification failed:', err.message);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Scheduler error:', error.message);
        }
    });

    // Check every 15 minutes for missed doses and send caregiver alerts
    cron.schedule('*/15 * * * *', async () => {
        try {
            const now = new Date();
            const fifteenMinAgo = new Date(now.getTime() - 15 * 60 * 1000);
            const todayStart = new Date(now);
            todayStart.setHours(0, 0, 0, 0);

            // Find untaken, non-snoozed logs from more than 15 min ago
            const missedLogs = await AdherenceLog.find({
                taken: false,
                snoozed: false,
                missedAlertSent: false,
                date: { $gte: todayStart },
                createdAt: { $lte: fifteenMinAgo }
            }).populate('medicineId', 'name dosage userId');

            for (const log of missedLogs) {
                if (!log.medicineId) continue;

                const user = await User.findById(log.medicineId.userId);
                if (user && user.caregiverEmail) {
                    await sendCaregiverAlert(
                        user.caregiverEmail,
                        user.name,
                        log.medicineId.name,
                        log.scheduledTime || 'Scheduled time'
                    );
                }

                // Mark alert as sent
                log.missedAlertSent = true;
                await log.save();
            }
        } catch (error) {
            console.error('Missed dose checker error:', error.message);
        }
    });
}

module.exports = { startScheduler };
