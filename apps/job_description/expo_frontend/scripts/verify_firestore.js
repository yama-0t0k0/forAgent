const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, getDoc } = require('firebase/firestore');

// Values obtained from .env or seed_firestore.js
const firebaseConfig = {
    apiKey: "AIzaSyBCSFKpWN5an3o5CDaG2Kgku-lHztXCojs",
    authDomain: "flutter-frontend-21d0a.firebaseapp.com",
    projectId: "flutter-frontend-21d0a",
    storageBucket: "flutter-frontend-21d0a.firebasestorage.app",
    messagingSenderId: "511656353816",
    appId: "1:511656353816:web:9d9e67fed63f081185236d",
    measurementId: "G-6NGX7TWPNJ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function verify() {
    try {
        console.log('--- Verifying job_description collection ---');
        
        // 1. Check parent collection
        const companiesSnap = await getDocs(collection(db, 'job_description'));
        console.log(`Found ${companiesSnap.size} company documents.`);
        
        const companyIds = companiesSnap.docs.map(d => d.id);
        console.log('Company IDs:', companyIds);

        if (!companyIds.includes('B00003')) {
            console.error('ERROR: B00003 document NOT found in job_description collection!');
            // Check if it exists as a virtual document? (getDoc might work even if not in list? No, list should show it if it exists)
        } else {
            console.log('SUCCESS: B00003 document found.');
        }

        // 2. Check B00003 subcollection specifically
        console.log('\n--- Checking B00003/JD_Number subcollection ---');
        const jdSnap = await getDocs(collection(db, 'job_description', 'B00003', 'JD_Number'));
        console.log(`Found ${jdSnap.size} JD documents for B00003.`);
        
        if (jdSnap.size === 0) {
             console.error('ERROR: No JD documents found for B00003!');
        } else {
            jdSnap.forEach(d => {
                console.log(` - JD: ${d.id}, Data keys: ${Object.keys(d.data()).join(', ')}`);
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('Error verifying Firestore:', error);
        process.exit(1);
    }
}

verify();
