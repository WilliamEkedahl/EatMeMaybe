/**
 * @author Martin U
 * @author William
 *
 * EatMeMaybe depends on firebase-app, Firebase-auth and firebase-firestore, using firebase modular style
 *
 * Firebase app is a firebase package that handles and coordinates the communication between the different firebase components
 * it initializes the connection to the firebase services by sending in our firebaseConfig information as an argument.
 *
 * Firebase Authentication handles the Authentication and is mainly used to authenticate that the user is logged in,
 * handling our account manager use cases FR1-5 in authenticate.js, as well as handling authentication in userInventory.js and Search.js.
 *
 *Firebase Firestore
 * Initializes our cloud-hosted NOSQL database that is used to store the userInventory, user information and the available products.
 *
 * FirebaseApp consists of the initialization information for a bunch of services,
 * Properties:
 * automaticDataCollectionEnabled -Boolean, A config flag to opt in/out of GDPR default set to TRUE:
 * name - -String, A custom name for the application
 * options -  The firebase config information to initialize the firebase connection with the database
 *
 * We only use the FirebaseApp Options property.
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

/**InitializeApp()
 * @param FirebaseOptions, ({object}, firebaseConfig)
 * @param FirebaseAppSettings,
 * it crates and initializes the connection to the database by sending in our firebaseConfig information as an argument FirebaseOptions
 * that we call firebaseConfig, FirebaseAppSettings is not used by our project as a parameter
 * but lets you enable DataCollection and set a custom name for the Firebase App.
 */

//initialize new version firebase V11
const app = initializeApp(firebaseConfig);

/**getFirestore()
 *@param *{FirebaseApp} app, which is the initialized connection from initializeApp(),
 *@returns *{firestore}  which is the firestore database instance used by the application to read/write/update/delete data,
 * which is stored and exported in the constant db.
 */
const db = getFirestore(app);

/**getAuth()
 * @param *{FirebaseApp} app, which is the initialized database connection from initializeApp()
 *@Returns *{Auth} Authentication instance used for authenticating the user, mainly used in authenticate.js and the following functions
 * signUp, logOut, signIn, changePassword, DeleteUserInventory and deleteCurrentUser.
 */
const auth = getAuth(app);

/**
 * We Use the export keyword to export the auth and db objects
 * so that other modules and files in our project can import and use them.
 */
export { auth, db };