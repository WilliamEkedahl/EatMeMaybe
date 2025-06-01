
/**
 * @author Martin U
 * @author William
*/

import {initializeApp} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// connetion to 'EatMeMaybe' project in Firebase
const firebaseConfig = {
    apiKey: "AIzaSyA1F8A9ct-uYem7euL3lv5ONhfbWTcow_M",
    authDomain: "eatmemaybe-d8140.firebaseapp.com",
    projectId: "eatmemaybe-d8140",
    storageBucket: "eatmemaybe-d8140.firebasestorage.app",
    messagingSenderId: "979614598830",
    appId: "1:979614598830:web:6373a77414a02403310f3f",
    measurementId: "G-L6PV0K8TZ1"
};

//initialize new version firebase V9
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };