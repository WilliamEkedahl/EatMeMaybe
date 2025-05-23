//signUpButton
const signUpBtn = document.getElementById('signUpButton');
if (signUpBtn) {
    signUpBtn.addEventListener('submit', function (event) {
        event.preventDefault();

        //input fields
        const email = document.getElementById('email').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const confPassword = document.getElementById('confPassword').value;

        if (password !== confPassword) {
            alert("Passwords do not match!");
            return;
        }
        signUp(email, username, password);
    });
}

//signInButton
const signInBtn = document.getElementById('signInButton');
if (signInBtn) {
    signInBtn.addEventListener('submit', function (event) {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        signIn(email, password);
    });
}


/**signUp
 * we retrive the auto generated UID that firebase makes for us.
 * @param email
 * @param username
 * @param password
 */

function signUp(email, username, password) {
    auth.createUserWithEmailAndPassword(email, password)
        .then(cred => {
            const UID = cred.user.uid; //A Unique firebase generated id for each user
            return db.collection("users").doc(UID).set({email: email, username: username});
        })
        .then(() => {
            window.location.href = "index.html";
        })
        .catch(error => {
            alert(error.message);
        });
}

/** SignIn
 * window.location.href changes the current window (view) to the specified page,
 * @param email
 * @param password
 */
//signIn
function signIn(email, password) {
    auth.signInWithEmailAndPassword(email, password)
    .then(result => {window.location.href = "index.html";})
        .catch(error => {
            alert(error.message);
        });
}

/**Signout
 *
 */
function signOut() {
    auth.signOut().then(result => {window.location.href = "login.html";})
}

/**UserAuthenticated
 *
 */
function userAuthenticated(callback){
    auth.onAuthStateChanged((user) => {
        if(user){
            callback(user);
        } else {
            window.location.href = "login.html";
        }
    });
}





