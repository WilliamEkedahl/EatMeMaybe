//import firebase modules
import {auth, db } from "./firestore.js";
import{
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword,
    deleteUser
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {clearUserInventoryCache} from "./cache.js";
import { doc, setDoc, getDocs, collection, changePassword, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

export async function signUp(email, username, password){
    try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const UID = cred.user.uid;
        await setDoc(doc(db, "users", UID), {email, username});
        signIn(email, password);
        window.location.href ="index.html";
    } catch (error) {
        alert(error.message);
    }
}

export async function signIn(email, password) {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = "index.html";
    } catch (error) {
        // I stedet for alert, kast feilen så den kan håndteres i koden som kaller signIn
        throw error;
    }
}

export async function logOut(){
    await signOut(auth);
    alert("User logged out");
    window.location.href="index.html";
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

export async function EmptyUserInventory() {
    const user = auth.currentUser;
    if (!user) throw new Error("User is not signed in.");
    const userId = user.uid;
    const inventoryRef = collection(db, "users", user.uid, "userInventory");
    try {
        const snapshot = await getDocs(inventoryRef);
        console.log("Found docs:", snapshot.docs.map(doc => doc.id));

        const deletePromises = snapshot.docs.map((docSnap) =>
            deleteDoc(doc(db, "users", user.uid, "userInventory", docSnap.id))
        );
        await Promise.all(deletePromises);
        clearUserInventoryCache(userId);
        window.location.reload();
        console.log("All items in the inventory deleted.");
    } catch (error) {
        console.error("Failed to delete inventory:", error);
        throw error;
    }
 }

 export async function changePassword(currentPassword, newPassword ){
    const user = auth.currentUser;
    if (!user) throw new Error("User is not signed in.");
    //Re-authentica user -To make firebase happy :D
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
    window.location.href = "index.html";
 }

export async function deleteCurrentUser() {
    const user = auth.currentUser;

    if (!user) {
        alert("Ingen bruker er logget inn.");
        return;
    }

    const confirmed = confirm("Er du sikker på at du vil slette kontoen din? Denne handlingen kan ikke angres, og alle dine data vil bli slettet.");
    if (!confirmed) {
        return;
    }

    try {
        // Steg 1: Slett brukerens inventardata fra Firestore (viktig å slette før brukeren selv)
        await deleteUserInventory();

        // Steg 2: Slett brukerens hovedprofil-dokument fra "users"-samlingen
        await deleteDoc(doc(db, "users", user.uid));
        console.log("Brukerprofil-dokument slettet fra Firestore.");

        // Steg 3: Slett selve brukeren fra Firebase Authentication
        await deleteUser(user);
        alert("Kontoen din er slettet.");
        window.location.href = "signIn.html"; // Omdiriger til påloggingssiden etter sletting
    } catch (error) {
        console.error("Feil ved sletting av bruker:", error);
        if (error.code === 'auth/requires-recent-login') {
            // Håndterer sikkerhetskravet ved å tvinge re-pålogging
            alert("For sikkerhets skyld må du logge inn på nytt for å slette kontoen din. Videresender til påloggingssiden.");
            window.location.href = "signIn.html";
        } else {
            alert(`Feil ved sletting av konto: ${error.message}`);
        }
    }
}
userAuthenticated();