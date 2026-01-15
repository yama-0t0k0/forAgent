const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// Values obtained from .env
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

const args = process.argv.slice(2);
const defaultJdPath = '/Users/yamakawamakoto/ReactNative_Expo/engineer-registration-app-yama/reference_information_fordev/json/jd.json';

async function seed() {
    try {
        let companyId = 'B00000';
        let jdNumber = '02';
        let jdPath = defaultJdPath;

        if (args[0]) companyId = args[0];
        if (args[1]) jdNumber = args[1];
        if (args[2]) jdPath = args[2];

        const jdData = JSON.parse(fs.readFileSync(jdPath, 'utf8'));

        console.log(`Reading data from ${jdPath}...`);
        console.log(`Target document: job_description/${companyId}/JD_Number/${jdNumber}`);

        // --- Data Augmentation (テンプレートjd.json利用時のみ) ---
        if (jdPath === defaultJdPath) {
            jdData['求人基本項目']['ポジション名'] = "サーバサイドエンジニア (Sample)";

            if (jdData['スキル経験']) {
                const skills = jdData['スキル経験'];
                if (skills['言語'] && skills['言語']['Go']) {
                    skills['言語']['Go']['専門的な知識やスキルを有し他者を育成/指導できる'] = true;
                }
                if (skills['言語'] && skills['言語']['JavaScript']) {
                    skills['言語']['JavaScript']['実務で数年の経験があり、主要メンバーとして応用的な問題を解決できる'] = true;
                }
                if (skills['クラウド/その他ツール/ミドルウェア等']
                    && skills['クラウド/その他ツール/ミドルウェア等']['クラウド']
                    && skills['クラウド/その他ツール/ミドルウェア等']['クラウド']['AWS']) {
                    skills['クラウド/その他ツール/ミドルウェア等']['クラウド']['AWS']['実務で基礎的なタスクを遂行可能'] = true;
                }
            }

            if (jdData['志向']
                && jdData['志向']['今後の希望']
                && jdData['志向']['今後の希望']['詳細設計/実装']) {
                jdData['志向']['今後の希望']['詳細設計/実装']['とてもやりたい'] = true;
            }
        }
        // -------------------------

        const docRef = doc(db, 'job_description', companyId, 'JD_Number', jdNumber);
        await setDoc(docRef, jdData);

        console.log(`Seeded job_description/${companyId}/JD_Number/${jdNumber} successfully!`);
        process.exit(0);
    } catch (error) {
        console.error('Error seeding Firestore:', error);
        process.exit(1);
    }
}

seed();
