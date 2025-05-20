
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";


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

// initialization of Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = getAuth(app);

//input fields
const email = document.getElementById('email').value;
const username = document.getElementById('username').value;
const password = document.getElementById('password').value;
const password = document.getElementById('confPassword').value;

const submit = document.getElementById('signUpButton');

submit.addEventListener('click', function(event) {
    event.preventDefault();
})

alert("works");