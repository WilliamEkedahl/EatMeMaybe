import {signIn, logOut, signUp, } from "./authenticate.js"
import {signOut} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

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
    const confPassword = document.getElementById('password2').value;


    if (!username || !email || !password || !confPassword) {
        alert("please fill in all the fields");
        return;
    }

    if (password.length > 45 || username.length > 45) {
        alert("The Username or Password can not be longer than 45 characters");
        return;
    }

    if (password.length < 8) {
        alert("password must be at least 8 characters long");
        return;
    }

    if (password !== confPassword) {
        alert("passwords do not match");
        return;
    }

    if (!email.includes('@')) {
        alert("Please enter a valid email");
    }
    signUp(email, username, password);
});

document.addEventListener("DOMContentLoaded", (e)=> {
    const signOutButton = document.getElementById("signOutButton");
    if (signOutButton) {
        signOutButton.addEventListener("click", (e) =>{
            e.preventDefault();
            logOut();
        });
    }
});

document.getElementById("signInButton").addEventListener("click", (e)=> {
    window.location.href = "HTML/signIn.html";
});

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".toggle-password").forEach(toggle => {
    toggle.addEventListener("click", () => {
      const input = document.getElementById(toggle.getAttribute("data-target"));
      if (input.type === "password") {
        input.type = "text";
      } else {
        input.type = "password";
      }
    });
  });
});



