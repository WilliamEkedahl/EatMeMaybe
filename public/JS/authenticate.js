/**
 * @author Marius
 * @author Martin U
 * @author William
*/

/**
 *Authenticate.js relies on the auth and db (firestore database) that were imported from firestore.js,
 * that originally imported them from firebase Auth and Firebase Firestore modules.
 *
 * It also imports a lot of functions directly from firebase-auth that are used to achieve the desired outcome in
 * the defined functions that more serve as wrappers to decide how the function should be executed and error messages.
 *
 * ClearUserInventoryCache is also imported from cache.js to clear (reload) the cache so that the user inventory is displayed
 * as empty locally as well when its only reading from the cache that otherwise only clears every 24 hours by itself.
 *
 *And a few functions are imported directly from firebase-firestore to handle
 * writing to the database and updating the database.
 *
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

/**SignUp()
 * @author William
 * @param email
 * @param username
 * @param password
 * @returns {Promise<void>}
 *
 * tries to run the fireBase function createUserWithEmailAndPassword which takes 3 arguments auth, email, password
 * the email and password are passed in from the user entered fields in the formed and checked for basic criterias
 * in authHandlers where the eventListener is located.
 *
 * auth is passed from firestore.js and keeps track of the authentication state.
 * if the promise succeeds we set the email and username using setDoc imported from firebase-firestore, it uses UID
 * which is the unique code created when the account was created with createUserWithEmailAndPassword to match where to
 * create the new document. The email is not unique, and is only checked if it is not too long, if that succeeds we run
 * our user created function signIn that in turn runs the firebase function
 * signInWithEmailAndPassword (Auth, email, password) which logs us into the application instantly after creating
 * our account since we got user feedback telling us that users did not want to signUp and then sigIn again directly
 * afterwards to use the application. If an error occurs the program throws the error message in the console for
 * troubleshooting and displays an error message to the user, that is designed to be vague for security reasons to not
 * expose user registered emails. The password storing is handled by google backend and is not controlled by the
 * application directly.
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
        throw new Error("Registration failed. Try a different email or password");
    }
}

/**SigIn()
 * @author William
 * @param email
 * @param password
 * @returns {Promise<void>}
 *
 * Tries to use the firebase auth method signInWIthEmailAndPassword, passes the auth imported from firestore.js again
 * as well as the constants email and password that are stored in  the system. auth can also be run with the function
 * getAuth(); the password and email are validated against the authentication. The client send the email and password
 * to firebase authentication server using HTTPS (secure protocol) Firebase matches the email and checks it against the
 * securely stored hashed password in their servers. If the function is successful firebase returns the authenticated
 * users info, an access-token and a refresh token to renew the tokens validity in the background if it expires.
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

/**logOut()
 * @author William
 * @returns {Promise<void>}
 *
 * auth.current user returns the user object from the user that is currently signed in.
 * if the user is not signed in no (auth.currentUser object exists) it alerts the user,
 * otherwise it runs the signOut function after the promise to check if the user is logged in or not is finished.
 * signOut() is a firebase function that takes an argument of auth that gets the signed-in users unique user ID
 * which controls the data that the user can see and "signs out the user by removing their rights to view their data"
 * after signOut is completed if it passes an alert user logged out is thrown and the user is switched to the index page
 * where there is code that checks if the user is logged in or not to display a message to the user to logIn or signUp.
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

/**deleteUserInventory()
 * @author William
 * @returns {Promise<void>}
 * @constructor
 *
 * The method Starts with checking for the unique auth id of the user to check if a user is signed in or not,
 * the userId is copied and stored in the constant userId, before running the method the user has to confirm that they
 * wish to proceed with deleting their entire inventory.
 *
 * the method gets all the documents in the users Inventory by taking a snapshot from the reference
 * that is created by inventoryRef (users/{userId}/userInventory
 *  uses getDocs to fetch all the documents in the userInventory collection at that moment of time,
 *  creates an array of all the documents and loops trough them using the javascript map() method to
 *  loop through the array of documents it collects the IDS and creates an array of delete promises that references
 *  the unique items in the database like a pointer.
 *  the method calls deleteDoc on every document found to delete it and then waits until all items are deleted from
 *  the database. When all Items are deleted from the database the method
 *  clearUserInventoryCache() is called that clears the local cache so that the inventory shows up as
 *  empty on the local client directly instead of only after 24hours when the cache is refreshed. The current window
 *  is also reloaded to show the changes in case the user deleted the inventory
 *  while already being on the inventory page.
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
        const deletePromises = snapshot.docs.map((docSnap) =>
            deleteDoc(doc(db, "users", user.uid, "userInventory", docSnap.id))
        );
        await Promise.all(deletePromises);
        clearUserInventoryCache(userId);
        window.location.reload();
        console.log("All items in the inventory deleted.");
    } catch (error) {
        console.error("Failed to delete inventory.", error);
        throw error;
    }
 }

/**changePassword()
 *@author William
 * @param currentPassword
 * @param newPassword
 * @returns {Promise<void>}
 *
 * Firstly the method checks if the user is signed in or not by checking for the users unique userID,
 * if the user is signed in the user is authenticated again since firebase only allows you to change your password
 * if you signed in, in the last 5 minutes. It uses the method reauthenticateWithCredential to reAuthenticate the user
 * if it returns a success promise then updatePassword is run where some logic in authHandlers makes sure the same
 * password security criteria are met and error handling, afterward the user is switched to the index page.
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