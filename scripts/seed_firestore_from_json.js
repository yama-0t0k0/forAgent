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

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

async function seedIndividual(individualId, jsonPath) {
  const id = (individualId || '').trim();
  if (!id || !id.startsWith('C')) {
    throw new Error('individualId は "C" 始まりのIDが必要です（例: C202501010001）');
  }
  if (!jsonPath) {
    throw new Error('individual 用の jsonPath が必要です');
  }
  const data = loadJson(jsonPath);
  data.id_individual = id;
  data.updated_at = new Date();

  const docRef = doc(db, 'individual', id);
  await setDoc(docRef, data, { merge: true });
  console.log(`Seeded individual/${id} successfully!`);
}

async function seedCompany(companyId, jsonPath) {
  const id = (companyId || '').trim();
  if (!id || !id.startsWith('B')) {
    throw new Error('companyId は "B" 始まりのIDが必要です（例: B00003）');
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

async function seedJD(companyId, jdNumber, jsonPath) {
  const cid = (companyId || '').trim();
  const jdn = (jdNumber || '').trim();
  if (!cid || !cid.startsWith('B')) {
    throw new Error('companyId は "B" 始まりのIDが必要です（例: B00003）');
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

