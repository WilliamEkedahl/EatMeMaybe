import {signIn, signUp} from "./authenticate.js"

document.getElementById("signInForm")?.addEventListener("submit", (e)=> {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    signIn(email, password);
});

document.getElementById("signUpForm").addEventListener("submit", (e)=> {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const confPassword = document.getElementById('confPassword').value;

    
    signUp(email, username, password);
});

