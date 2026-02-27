const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

if (!envContent.includes('VAPID_PUBLIC_KEY')) {
    const vapidKeys = webpush.generateVAPIDKeys();

    envContent += `\n# Web Push VAPID Keys\n`;
    envContent += `VAPID_PUBLIC_KEY=${vapidKeys.publicKey}\n`;
    envContent += `VAPID_PRIVATE_KEY=${vapidKeys.privateKey}\n`;
    envContent += `VAPID_SUBJECT=mailto:admin@medbs.local\n`;

    fs.writeFileSync(envPath, envContent);
    console.log('✅ Generated new VAPID keys and appended to .env');
    console.log('Public Key for Frontend:', vapidKeys.publicKey);
} else {
    console.log('VAPID keys already exist in .env');
}
