const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc, getDocs, collection } = require("firebase/firestore");
const { getAuth, signInWithEmailAndPassword } = require("firebase/auth");
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// --- Helper: Load .env manually ---
function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
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

// --- Helpers ---
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// --- Main ---
async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  console.log('--- Selection Progress Seeding Tool ---');
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
    await signInWithEmailAndPassword(auth, email, password);
    console.log('Signed in successfully.');

    // 1. Fetch Existing Users
    console.log('\nFetching existing users (public_profile)...');
    const usersSnap = await getDocs(collection(db, 'public_profile'));
    const userIds = usersSnap.docs.map(d => d.id);
    console.log(`Found ${userIds.length} users.`);

    if (userIds.length === 0) {
      console.error('No users found in public_profile. Aborting.');
      process.exit(1);
    }

    // 2. Fetch Existing Companies
    console.log('Fetching existing companies...');
    const companiesSnap = await getDocs(collection(db, 'company'));
    const corporateSnap = await getDocs(collection(db, 'corporate')); // Fallback
    
    // Merge company IDs
    const companyIds = new Set([
        ...companiesSnap.docs.map(d => d.id),
        ...corporateSnap.docs.map(d => d.id)
    ]);
    const companyIdList = Array.from(companyIds);
    console.log(`Found ${companyIdList.length} companies.`);

    if (companyIdList.length === 0) {
      console.error('No companies found. Aborting.');
      process.exit(1);
    }

    // 3. Fetch Jobs (optional but recommended for realistic data)
    console.log('Fetching existing jobs...');
    // Note: Jobs are nested: /job_description/{companyId}/JD_Number/{jdId}
    const jobs = [];
    // We iterate over companies to find jobs
    const jobDescSnap = await getDocs(collection(db, 'job_description'));
    for (const docSnap of jobDescSnap.docs) {
        const companyId = docSnap.id;
        const jdSubSnap = await getDocs(collection(db, 'job_description', companyId, 'JD_Number'));
        jdSubSnap.forEach(jd => {
            jobs.push({
                jdId: jd.id, // Usually the doc ID is the JD_Number or generated ID
                companyId: companyId,
                data: jd.data()
            });
        });
    }
    console.log(`Found ${jobs.length} jobs.`);

    // 4. Generate Selection Progress
    console.log('\nGenerating selection_progress data...');
    const SELECTION_COUNT = 20; // Number of records to create

    for (let i = 0; i < SELECTION_COUNT; i++) {
        const userId = getRandomItem(userIds);
        
        let companyId, jdId, jdNumber;
        
        if (jobs.length > 0) {
            const job = getRandomItem(jobs);
            companyId = job.companyId;
            jdId = job.jdId;
            jdNumber = job.data.JD_Number || jdId;
        } else {
            // Fallback if no jobs exist
            companyId = getRandomItem(companyIdList);
            jdId = `JD-${getRandomInt(1000, 9999)}`;
            jdNumber = jdId;
        }

        const phases = [
            'document_screening_書類選考',
            '1st_interview_1次面接',
            '2nd_interview_2次面接',
            'final_interview_最終面接',
            'offer_オファー面談'
        ];
        const statuses = ['調整中', '結果待ち', '合格', '不合格', '辞退'];

        const docId = `SEL-${Date.now()}-${i}`;
        const data = {
            JobStatID: docId,
            id_individual_個人ID: userId,
            id_company_法人ID: companyId,
            JD_Number: jdNumber,
            '選考進捗': {
                'fase_フェイズ': getRandomItem(phases),
                'status_ステータス': getRandomItem(statuses)
            },
            '紹介料管理': {
                'billing_amount_請求金額': 0,
                'estimated_annual_salary_想定年収': getRandomInt(400, 1200) * 10000,
                'fee_rate_料率': 35
            },
            'UpdateTimestamp_yyyymmddtttttt': new Date().toISOString()
        };

        await setDoc(doc(db, 'selection_progress', docId), data);
        console.log(`Created selection: ${docId} (User: ${userId}, Comp: ${companyId})`);
    }

    console.log('\n✅ Seeding completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
