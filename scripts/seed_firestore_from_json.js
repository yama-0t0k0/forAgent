// 役割（機能概要）:
// - 既に生成・レビュー済みの Individual / Company / JD JSONファイルをFirestoreへ投入する専用スクリプト
// - 提供機能:
//   - individual: individual/{individualId} への upsert
//   - company: company/{companyId} への upsert
//   - jd: job_description/{companyId}/JD_Number/{jdNumber} への upsert（親docも冪等生成）
// - 使用ライブラリ: Firebase Web SDK (firebase/app, firebase/firestore), Node.js(fs)
// - 技術的ポイント: JSONの生成は行わず、「② Firestoreへの追加」のみ担当
//
// ディレクトリ構造:
// - 本ファイル: engineer-registration-app-yama/scripts/seed_firestore_from_json.js
// - 想定入力:
//   - reference_information_fordev/json/Individual/{individualId}.json
//   - reference_information_fordev/json/company/{companyId}.json
//   - reference_information_fordev/json/jd/{companyId}/{companyId}_{jdNumber}.json
//
// 実行方法:
// - Individual投入:
//   - node engineer-registration-app-yama/scripts/seed_firestore_from_json.js individual C202501010001 /path/to/C202501010001.json
// - 会社投入:
//   - node engineer-registration-app-yama/scripts/seed_firestore_from_json.js company B00003 engineer-registration-app-yama/reference_information_fordev/json/company/B00003.json
// - 求人投入:
//   - node engineer-registration-app-yama/scripts/seed_firestore_from_json.js jd B00003 01 engineer-registration-app-yama/reference_information_fordev/json/jd/B00003/B00003_01.json

const fs = require('fs');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyBCSFKpWN5an3o5CDaG2Kgku-lHztXCojs',
  authDomain: 'flutter-frontend-21d0a.firebaseapp.com',
  projectId: 'flutter-frontend-21d0a',
  storageBucket: 'flutter-frontend-21d0a.firebasestorage.app',
  messagingSenderId: '511656353816',
  appId: '1:511656353816:web:9d9e67fed63f081185236d',
  measurementId: 'G-6NGX7TWPNJ'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Load JSON file
 * @param {string} p - File path
 * @returns {object} JSON data
 */
function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

/**
 * Seed Individual Data
 * @param {string} individualId - Individual ID
 * @param {string} jsonPath - JSON file path
 */
async function seedIndividual(individualId, jsonPath) {
  const id = (individualId || '').trim();
  if (!id || !id.startsWith('C')) {
    throw new Error('individualId は \'C\' 始まりのIDが必要です（例: C202501010001）');
  }
  if (!jsonPath) {
    throw new Error('individual 用の jsonPath が必要です');
  }
  const data = loadJson(jsonPath);
  data.id_individual = id;
  data.updated_at = new Date();

  // Split data into public_profile and private_info
  // Logic mirrors scripts/migration/migrate_individual.js

  const basicInfo = data['基本情報'] || {};
  const privateData = {};
  
  // Extract PII from '基本情報' if exists
  if (data['基本情報']) {
    const piiKeys = [
      '姓', '名', 'Family name(半角英)', 'First name(半角英)', 
      'メール', 'TEL', '住所', '生年月日',
      'Googleアカウント', 'GitHubアカウント', 'ハンドルネーム',
      'パスワード'
    ];

    const topLevelPii = [
      'name', 'nameKana', 'birthDate', 'email', 'phoneNumber', 'tel', 'address', 'resumeUrl', 'resume'
    ];

    piiKeys.forEach(key => {
      if (basicInfo[key] !== undefined) {
        if (!privateData['基本情報']) privateData['基本情報'] = {};
        privateData['基本情報'][key] = basicInfo[key];
        delete basicInfo[key];
      }
    });
    
    topLevelPii.forEach(key => {
      if (data[key] !== undefined) {
        privateData[key] = data[key];
        delete data[key];
      }
    });
  }

  const publicData = { ...data };
  // Ensure ID and timestamp are in both
  privateData.id_individual = id;
  privateData.updated_at = new Date();
  publicData.id_individual = id;
  publicData.updated_at = new Date();

  // Write to public_profile
  const publicRef = doc(db, 'public_profile', id);
  await setDoc(publicRef, publicData, { merge: true });
  console.log(`Seeded public_profile/${id} successfully!`);

  // Write to private_info
  const privateRef = doc(db, 'private_info', id);
  await setDoc(privateRef, privateData, { merge: true });
  console.log(`Seeded private_info/${id} successfully!`);
}

/**
 * Seed Company Data
 * @param {string} companyId - Company ID
 * @param {string} jsonPath - JSON file path
 */
async function seedCompany(companyId, jsonPath) {
  const id = (companyId || '').trim();
  if (!id || !id.startsWith('B')) {
    throw new Error('companyId は \'B\' 始まりのIDが必要です（例: B00003）');
  }
  if (!jsonPath) {
    throw new Error('company 用の jsonPath が必要です');
  }
  const data = loadJson(jsonPath);
  data.id = id;
  data.updated_at = new Date();

  const docRef = doc(db, 'company', id);
  await setDoc(docRef, data, { merge: true });
  console.log(`Seeded company/${id} successfully!`);
}

/**
 * Seed JD Data
 * @param {string} companyId - Company ID
 * @param {string} jdNumber - JD Number
 * @param {string} jsonPath - JSON file path
 */
async function seedJD(companyId, jdNumber, jsonPath) {
  const cid = (companyId || '').trim();
  const jdn = (jdNumber || '').trim();
  if (!cid || !cid.startsWith('B')) {
    throw new Error('companyId は \'B\' 始まりのIDが必要です（例: B00003）');
  }
  if (!jdn) {
    throw new Error('jdNumber が必要です（例: 01）');
  }
  if (!jsonPath) {
    throw new Error('jd 用の jsonPath が必要です');
  }
  const data = loadJson(jsonPath);
  data.company_ID = cid;
  data.JD_Number = jdn;
  data.createdAt = data.createdAt || new Date();
  data.updatedAt = new Date();

  const companyDocRef = doc(db, 'job_description', cid);
  await setDoc(companyDocRef, { company_ID: cid, last_updated: new Date() }, { merge: true });

  const jdDocRef = doc(db, 'job_description', cid, 'JD_Number', jdn);
  await setDoc(jdDocRef, data, { merge: true });
  console.log(`Seeded job_description/${cid}/JD_Number/${jdn} successfully!`);
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log('Usage: seed_firestore_from_json.js <individual|company|jd> [...params]');
    console.log('Examples:');
    console.log('  individual C202501010001 /path/to/C202501010001.json');
    console.log('  company B00003 engineer-registration-app-yama/reference_information_fordev/json/company/B00003.json');
    console.log('  jd B00003 01 engineer-registration-app-yama/reference_information_fordev/json/jd/B00003/B00003_01.json');
    process.exit(1);
  }

  const target = args[0];

  try {
    if (target === 'individual') {
      const individualId = args[1];
      const jsonPath = args[2];
      await seedIndividual(individualId, jsonPath);
    } else if (target === 'company') {
      const companyId = args[1];
      const jsonPath = args[2];
      await seedCompany(companyId, jsonPath);
    } else if (target === 'jd') {
      const companyId = args[1];
      const jdNumber = args[2];
      const jsonPath = args[3];
      await seedJD(companyId, jdNumber, jsonPath);
    } else {
      throw new Error('コマンドが不正です（individual, company または jd を指定してください）');
    }
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

main();

