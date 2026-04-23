const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const admin = require('firebase-admin');

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'demo-project' });
}
const db = admin.firestore();

const phase = process.argv[2]; // 'before' | 'after'
const appName = process.argv[3] || 'unknown_app';
const evidenceDir = path.join(__dirname, '..', 'evidence');
const rootDir = path.join(__dirname, '..', '..');

if (!fs.existsSync(evidenceDir)) {
  fs.mkdirSync(evidenceDir, { recursive: true });
}

const appUserMap = {
  'admin_app': 'A999',
  'corporate_user_app': 'B00001',
  'individual_user_app': 'C000000000001',
  'lp_app': 'C000000000001'
};

async function getDoc() {
  const uid = appUserMap[appName];
  if (!uid) return null;
  const doc = await db.collection('users').doc(uid).get();
  return doc.exists ? doc.data() : null;
}

function rotateEvidence() {
  const files = fs.readdirSync(evidenceDir).filter(f => f.startsWith(`${appName}_`));
  
  // タイムスタンプ部分でグループ化
  const groups = {};
  files.forEach(f => {
    const match = f.match(/(\d{8}_\d{6})/);
    const ts = match ? match[1] : f;
    if (!groups[ts]) groups[ts] = [];
    groups[ts].push(f);
  });

  const sortedTs = Object.keys(groups).sort().reverse();
  const maxKeep = 5; 
  if (sortedTs.length > maxKeep) {
    console.log(`🧹 Rotating Maestro evidence for ${appName} (Keeping latest ${maxKeep} runs)`);
    for (let i = maxKeep; i < sortedTs.length; i++) {
      const ts = sortedTs[i];
      groups[ts].forEach(f => {
        try {
          fs.unlinkSync(path.join(evidenceDir, f));
        } catch(e) {}
      });
    }
  }
}

async function capture() {
  const now = new Date();
  const timestamp = now.getFullYear().toString() + 
    (now.getMonth() + 1).toString().padStart(2, '0') + 
    now.getDate().toString().padStart(2, '0') + "_" + 
    now.getHours().toString().padStart(2, '0') + 
    now.getMinutes().toString().padStart(2, '0') + 
    now.getSeconds().toString().padStart(2, '0');
  
  if (phase === 'before') {
    const data = await getDoc();
    fs.writeFileSync(path.join(evidenceDir, `${appName}_state.tmp.json`), JSON.stringify(data, null, 2));
    console.log(`📸 Initial JSON state captured for ${appName}`);
  } else if (phase === 'after') {
    // 1. Handle Firestore Diff
    const data = await getDoc();
    const afterPath = path.join(evidenceDir, `${appName}_${timestamp}_after.json`);
    const beforeTmp = path.join(evidenceDir, `${appName}_state.tmp.json`);
    
    let diffLog = "No difference or file missing.";
    if (fs.existsSync(beforeTmp)) {
      const beforeData = fs.readFileSync(beforeTmp, 'utf8');
      const afterData = JSON.stringify(data, null, 2);
      fs.writeFileSync(afterPath, afterData);
      
      try {
        const diff = execSync(`diff -u ${beforeTmp} ${afterPath}`).toString();
        diffLog = diff ? diff : "No changes detected.";
      } catch (e) {
        diffLog = e.stdout ? e.stdout.toString() : e.message;
      }
      fs.unlinkSync(beforeTmp);
    }
    const diffPath = path.join(evidenceDir, `${appName}_${timestamp}_diff.log`);
    fs.writeFileSync(diffPath, diffLog);

    // 2. Collect Maestro Screenshots (internal to YAML)
    // We look for files like "lp_app_launched.png" in the root directory
    const maestroFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.png') && !f.includes('evidence'));
    maestroFiles.forEach(f => {
      const newName = `${appName}_${timestamp}_maestro_${f}`;
      fs.renameSync(path.join(rootDir, f), path.join(evidenceDir, newName));
      console.log(`📸 Moved Maestro evidence: ${f} -> ${newName}`);
    });

    // 3. Save Final Fallback Screenshot
    const screenshotPath = path.join(evidenceDir, `${appName}_${timestamp}_screen_final.png`);
    try {
      execSync(`xcrun simctl io booted screenshot "${screenshotPath}"`);
      console.log(`📸 Final screenshot captured for ${appName}`);
    } catch(e) {
      console.error("⚠️ Failed to capture final screenshot:", e.message);
    }

    // 4. Log Analysis
    const logFile = path.join(evidenceDir, `maestro_${appName}.log`);
    if (fs.existsSync(logFile)) {
      // Move and rename the log file to be part of the set
      const newLogName = `${appName}_${timestamp}_maestro.log`;
      fs.renameSync(logFile, path.join(evidenceDir, newLogName));
      console.log(`📝 Maestro log archived as: ${newLogName}`);
    }
    
    rotateEvidence();
  }
  process.exit(0);
}

capture().catch(console.error);
