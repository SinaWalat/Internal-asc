const { initializeApp } = require('firebase/app');
const { getStorage, ref, getDownloadURL } = require('firebase/storage');

const firebaseConfig = {
  projectId: "studio-6606920957-66aff",
  appId: "1:292733103326:web:8f61338b7101443e02664f",
  apiKey: "AIzaSyDKuG1swOiWLmzxC5B3Hn3lembzlDuAA5Q",
  authDomain: "studio-6606920957-66aff.firebaseapp.com",
  storageBucket: "studio-6606920957-66aff.firebasestorage.app"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

async function run() {
  try {
    const fileRef = ref(storage, 'kyc-verification/RsdxvOOBHqbpjfs9qKuPrrk6xIh2/front');
    const url = await getDownloadURL(fileRef);
    console.log("New URL:", url);
  } catch (err) {
    console.error("Storage Error:", err.message);
  }
}
run();
