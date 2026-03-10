const admin = require('./node_modules/firebase-admin');

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

admin.initializeApp({
    projectId: 'flutter-frontend-21d0a'
});

const db = admin.firestore();

async function listDocs() {
    const collections = ['Users', 'users'];

    for (const collName of collections) {
        console.log(`--- Firestore ${collName} collection ---`);
        const snapshot = await db.collection(collName).select().get();
        snapshot.forEach(doc => {
            console.log(`DocID: ${doc.id}`);
        });
    }
}

listDocs().catch(console.error);
