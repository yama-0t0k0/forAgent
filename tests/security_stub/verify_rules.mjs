// Verify Firestore hardened rules against the emulator
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, doc, getDoc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBCSFKpWN5an3o5CDaG2Kgku-lHztXCojs",
  projectId: "flutter-frontend-21d0a",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
connectFirestoreEmulator(db, 'localhost', 8080);

const results = [];

function logResult(testName, passed, detail) {
  const status = passed ? 'PASS' : 'FAIL';
  const icon = passed ? '✅' : '❌';
  results.push({ testName, status, detail });
  console.log(`${icon} [${status}] ${testName}: ${detail}`);
}

async function runTests() {
  console.log('=== Firestore Security Rules Verification (Emulator) ===\n');

  // Test 1: Unauthenticated READ on users collection
  try {
    const snap = await getDoc(doc(db, 'users', 'victim_uid'));
    logResult('Unauth Read (users)', false, `Read succeeded (data: ${JSON.stringify(snap.data())})`);
  } catch (e) {
    logResult('Unauth Read (users)', e.code === 'permission-denied', e.code || e.message);
  }

  // Test 2: Unauthenticated READ on private_info (Lateral Movement)
  try {
    const snap = await getDoc(doc(db, 'private_info', 'victim_uid'));
    logResult('Lateral Movement (private_info)', false, `Read succeeded (data: ${JSON.stringify(snap.data())})`);
  } catch (e) {
    logResult('Lateral Movement (private_info)', e.code === 'permission-denied', e.code || e.message);
  }

  // Test 3: Unauthenticated Privilege Escalation
  try {
    await setDoc(doc(db, 'users', 'attacker_uid'), { role: 'admin', name: 'hacker' });
    logResult('Privilege Escalation (role:admin)', false, 'Write succeeded - VULNERABILITY!');
  } catch (e) {
    logResult('Privilege Escalation (role:admin)', e.code === 'permission-denied', e.code || e.message);
  }

  // Test 4: Schema Validation Bypass (non-string name in public_profile)
  try {
    await setDoc(doc(db, 'public_profile', 'victim_uid'), { name: 12345 });
    logResult('Schema Bypass (non-string name)', false, 'Write succeeded with non-string name!');
  } catch (e) {
    logResult('Schema Bypass (non-string name)', e.code === 'permission-denied', e.code || e.message);
  }

  // Test 5: Unauthorized Deletion of company record
  try {
    await deleteDoc(doc(db, 'company', 'any_company_id'));
    logResult('Unauthorized Delete (company)', false, 'Delete succeeded - VULNERABILITY!');
  } catch (e) {
    logResult('Unauthorized Delete (company)', e.code === 'permission-denied', e.code || e.message);
  }

  // Test 6: Unauthenticated READ on company collection  
  try {
    const snap = await getDoc(doc(db, 'company', 'test_company'));
    logResult('Unauth Read (company)', false, `Read succeeded (data: ${JSON.stringify(snap.data())})`);
  } catch (e) {
    logResult('Unauth Read (company)', e.code === 'permission-denied', e.code || e.message);
  }

  // Test 7: Unauthenticated READ on public_profile
  try {
    const snap = await getDoc(doc(db, 'public_profile', 'test_uid'));
    logResult('Unauth Read (public_profile)', false, `Read succeeded (data: ${JSON.stringify(snap.data())})`);
  } catch (e) {
    logResult('Unauth Read (public_profile)', e.code === 'permission-denied', e.code || e.message);
  }

  // Summary
  console.log('\n=== SUMMARY ===');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\n🛡️  ALL TESTS PASSED: Security rules are properly hardened.');
  } else {
    console.log('\n⚠️  VULNERABILITIES DETECTED: Some tests failed!');
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(2);
});
