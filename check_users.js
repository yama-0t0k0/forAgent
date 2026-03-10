const admin = require('./node_modules/firebase-admin');

process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

admin.initializeApp({
    projectId: 'flutter-frontend-21d0a'
});

async function listUsers() {
    const result = await admin.auth().listUsers();
    console.log('--- Auth Emulator Users ---');
    result.users.forEach(u => {
        console.log(`Email: ${u.email}, UID: ${u.uid}`);
    });
    console.log('---------------------------');
}

listUsers().catch(console.error);
