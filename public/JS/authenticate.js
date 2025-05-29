//import firebase modules
import {auth, db } from "./firestore.js";
import{
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

import { doc, setDoc, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

export async function signUp(email, username, password){
    try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const UID = cred.user.uid;
        await setDoc(doc(db, "users", UID), {email, username});
        const userInventory = collection(db, "users", UID, "userInventory");
        await addDoc(userInventory, {
            addedAt: new Date(),
            category: "firstItem",
            name:  "firstItem",
            quantity: 1,
        });
        window.location.href ="signIn.html";
    } catch (error) {
        alert(error.message);
    }
}

export async function signIn(email,password){
    try{
        await signInWithEmailAndPassword(auth, email, password)
        window.location.href ="../index.html";
    } catch (error) {
        alert(error.message);
    }
}

export async function logOut(){
    await signOut(auth);
    alert("User logged out");
}

export function userAuthenticated(callback = null) { // Gjør callback valgfri med standardverdi null
    onAuthStateChanged(auth, (user) => {
        const mainContent = document.getElementById("main-content");
        const notLoggedInMessage = document.querySelector(".auth-message");

        if (user) {
            // Bruker er logget inn
            if (mainContent) mainContent.style.display = "block";
            if (notLoggedInMessage) notLoggedInMessage.style.display = "none";

            // Hvis det er en callback-funksjon, kjør den med brukerobjektet
            if (callback && typeof callback === 'function') {
                callback(user);
            }
        } else {
            // Ingen bruker er logget inn
            if (mainContent) mainContent.style.display = "none";
            if (notLoggedInMessage) notLoggedInMessage.style.display = "block";
        }
    });
}

userAuthenticated();