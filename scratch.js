const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, limit, query } = require('firebase/firestore');

const firebaseConfig = {
  projectId: "idcard-project-5e60d",
  // We don't have the full config here easily without the env vars.
};
