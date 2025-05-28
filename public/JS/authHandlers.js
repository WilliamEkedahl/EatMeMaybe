import {signIn} from "./authenticate.js"

document.getElementById("signInForm")?.addEventListener("submit", (e)=> {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    signIn(email, password);
});
