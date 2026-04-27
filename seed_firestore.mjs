
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBk1iwcz6yP9GCxNDbF7ouxHqUlGhakEk8",
    authDomain: "antigravity-566d0.firebaseapp.com",
    projectId: "antigravity-566d0",
    storageBucket: "antigravity-566d0.firebasestorage.app",
    messagingSenderId: "364978734934",
    appId: "1:364978734934:web:42ef882f0d005eba61b8f7",
    measurementId: "G-NVNJV54Z7K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedData() {
    try {
        console.log("Seeding data to 'sample_data' collection...");

        const docRef = await addDoc(collection(db, "sample_data"), {
            message: "Hello from Antigravity!",
            timestamp: new Date(),
            randomValue: Math.random()
        });

        console.log("Document written with ID: ", docRef.id);

        console.log("Reading back data...");
        const querySnapshot = await getDocs(collection(db, "sample_data"));
        querySnapshot.forEach((doc) => {
            console.log(`${doc.id} => ${JSON.stringify(doc.data())}`);
        });

        process.exit(0);
    } catch (e) {
        console.error("Error adding document: ", e);
        process.exit(1);
    }
}

seedData();
