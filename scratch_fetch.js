const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, limit, query } = require('firebase/firestore');

const firebaseConfig = {
  projectId: "studio-6606920957-66aff",
  appId: "1:292733103326:web:8f61338b7101443e02664f",
  apiKey: "AIzaSyDKuG1swOiWLmzxC5B3Hn3lembzlDuAA5Q",
  authDomain: "studio-6606920957-66aff.firebaseapp.com",
  storageBucket: "studio-6606920957-66aff.firebasestorage.app"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const q = query(collection(db, 'KYC_Verifications'), limit(3));
  const snap = await getDocs(q);
  snap.forEach(doc => {
    console.log(doc.id, JSON.stringify(doc.data(), null, 2));
  });
}
run().catch(console.error);
