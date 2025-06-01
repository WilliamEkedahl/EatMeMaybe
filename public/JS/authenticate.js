/**
 * @author Marius
 * @author Martin U
 * @author William
*/

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
import { doc, setDoc, getDocs, collection, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

/**
 * @author William E
 * @param email
 * @param username
 * @param password
 * @returns {Promise<void>}
 */
export async function signUp(email, username, password){
    try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const UID = cred.user.uid;
        await setDoc(doc(db, "users", UID), {email, username});
        await signIn(email, password);
        window.location.href = "index.html";
    } catch (error) {
        // Skjul spesifikke feil (som om e-post er i bruk)
        console.error("Sign up failed:", error.code); // Logg internt hvis ønskelig
        throw new Error("Registration failed. Try again later.");
    }
}

/**
 * @author William E
 * @param email
 * @param password
 * @returns {Promise<void>}
 */
export async function signIn(email, password) {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = "index.html";
    } catch (error) {
        // I stedet for alert, kast feilen så den kan håndteres i koden som kaller signIn
        throw error;
    }
}

/**
 * @author William E
 * @returns {Promise<void>}
 */
export async function logOut(){
    const user = auth.currentUser;
    if (!user) {
        alert("Ingen bruker er logget inn.");
        return;
    }

    await signOut(auth);
    alert("User logged out");
    window.location.href="index.html";
}

/**
 * @author Martin U
 * @param callback
 */
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

/**
 *
 * @returns {Promise<void>}
 * @constructor
 */
export async function deleteUserInventory() {
    const user = auth.currentUser;
    if (!user) throw new Error("User is not signed in.");
    const userId = user.uid;

    const confirmed = confirm("Are you sure you want to delete your inventory? This change is irreversible, and all of your products will be deleted!");
    if (!confirmed) {
        return;
    }

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

/**
 *
 * @param currentPassword
 * @param newPassword
 * @returns {Promise<void>}
 */
 export async function changePassword(currentPassword, newPassword ){
    const user = auth.currentUser;
    if (!user) throw new Error("User is not signed in.");
    //Re-authentica user -To make firebase happy :D
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
    window.location.href = "index.html";
 }

/**
 * @author Martin U
 * @returns {Promise<void>}
 */
export async function deleteCurrentUser() {
    const user = auth.currentUser;

    if (!user) {
        alert("Ingen bruker er logget inn.");
        return;
    }

    const confirmed = confirm("Are you sure you want to delete your account? This change is irreversible, and all of your data will be deleted!");
    if (!confirmed) {
        return; // Stops the process if user cancels
    }

    try {
        // Delete the user's inventory from Firestore based of the uid
        await deleteDoc(doc(db, "users", user.uid, "userInventory", user.uid))
        console.log("User's userInventory is now deleted from Firestore");

        // Delete user's profile doc from "users" collection
        await deleteDoc(doc(db, "users", user.uid));
        console.log("Userprofile is now deleted from Firestore");

        // Delete user from Firebase Authentication
        await deleteUser(user);
        alert("Your account is now deleted!");
        window.location.href = "signIn.html"; // Redircects user to sign-in page after deletion
    } catch (error) {
        console.error("Feil ved sletting av bruker:", error);
        if (error.code === 'auth/requires-recent-login') {
            // Checks if user is logged in recently. If not it will, for security reasons, 
            // ask user to log in again to comlete deletion.
            alert("For security reasons, you need to log in again to delete your account. Redirecting to the login page.");
            window.location.href = "signIn.html";
        } else {
            alert(`Feil ved sletting av konto: ${error.message}`);
        }
    }
}

userAuthenticated();