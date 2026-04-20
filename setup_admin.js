const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Basic .env loader since dotenv is not a dependency
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
        }
    });
}

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

admin.initializeApp({
    projectId: process.env.ADMIN_STRATEGY_PROJECT_ID || 'flutter-frontend-21d0a'
});

const auth = admin.auth();
const db = admin.firestore();

async function setup() {
    const email = 'm.yamakawa@lat-inc.com';
    const password = process.env.ADMIN_PASSWORD || 'password123';

    console.log(`Setting up user: ${email}...`);

    try {
        let user;
        try {
            user = await auth.getUserByEmail(email);
            console.log('User already exists. Updating...');
        } catch (e) {
            user = await auth.createUser({
                email,
                password,
                emailVerified: true
            });
            console.log('User created successfully.');
        }

        const uid = user.uid;

        // Set custom claims
        await auth.setCustomUserClaims(uid, { role: 'admin' });
        console.log('Custom claims set: role=admin');

        // Create Firestore document
        // We'll use the 'Users' collection (capital U) as seen in previous logs
        await db.collection('Users').doc(uid).set({
            email,
            displayName: 'Yamakawa Makoto',
            role: 'admin',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`Firestore document setup complete for UID: ${uid}`);
        console.log('\n--- SETUP COMPLETE ---');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log(`UID: ${uid}`);
        console.log('-----------------------');

    } catch (error) {
        console.error('Setup failed:', error);
    }
}

setup();
