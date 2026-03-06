import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, getDocs, increment, deleteDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyAmTKBtyn_94bx9EHi7iNdasc1R4WjbWUM",
  authDomain: "kuran-ae9ae.firebaseapp.com",
  projectId: "kuran-ae9ae",
  storageBucket: "kuran-ae9ae.firebasestorage.app",
  messagingSenderId: "758450936349",
  appId: "1:758450936349:web:ac1ad21488dd54a7b544f4",
  measurementId: "G-DCB3XP7L0E"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
try { getAnalytics(app); } catch(e) {}

async function saveUserProfile(user) {
    try {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        const profileData = {
            uid: user.uid,
            email: user.email || null,
            displayName: user.displayName || null,
            photoURL: user.photoURL || null,
            provider: (user.providerData && user.providerData[0]) ? user.providerData[0].providerId : 'password',
            lastSeen: Date.now()
        };
        if (!snap.exists()) {
            profileData.createdAt = Date.now();
            profileData.stats = {};
            await setDoc(ref, profileData);
        } else {
            await updateDoc(ref, { lastSeen: Date.now(), displayName: profileData.displayName, photoURL: profileData.photoURL });
        }
    } catch(e) { console.warn('Profil kaydedilemedi:', e); }
}

// Presence sistemi
async function setUserPresence(uid, displayName) {
    try {
        await setDoc(doc(db, 'presence', uid), {
            uid, displayName: displayName || 'Misafir',
            online: true, lastSeen: Date.now()
        });
    } catch(e) {}
}

async function clearUserPresence(uid) {
    try {
        await updateDoc(doc(db, 'presence', uid), { online: false, lastSeen: Date.now() });
    } catch(e) {}
}

window.FirebaseAuth = {
    auth, db, googleProvider,
    createUserWithEmailAndPassword, signInWithEmailAndPassword,
    signOut, onAuthStateChanged, signInWithPopup, updateProfile,
    doc, setDoc, getDoc, updateDoc, collection, getDocs, increment,
    deleteDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp,
    saveUserProfile, setUserPresence, clearUserPresence
};

window._firestoreCollection = (db, path) => collection(db, path);
window._firestoreGetDocs = (ref) => getDocs(ref);

console.log("%c🔥 Firebase hazır v2", "color:#f59e0b;font-weight:bold");
