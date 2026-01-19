//import firebase modules
import {auth, db } from "../JS/firebase.js";
import{
    createUserWithEmailAndPassword, signInWithEmailAndPassword,
    signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { doc, setDoc, getDoc, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

export async function signUp(email, username, password){
    try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const UID = cred.user.uid;
        await setDoc(doc(db, "users", UID), {email, username});

        //Add subCollection userInventory with a item since you cant create a empty subCollection in firebase
        const userInventory = collection(db, "users", uid, "userInventory");
        await adddoc(userInventory, {
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

export async function signIn(email, password){
    try{
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href ="../index.html";
    } catch (error) {
        alert(error.message);
    }
}

export async function logOut(){
    await signOut(auth);
    window.location.href="signIn.html";
}

export function userAuthenticated(callback){
    onAuthStateChanged(auth, (user) => {
        if (user) {
            callback(user);
        } else {
            window.location.href="signIn.html";
        }
    });
}