import {signIn, logOut, signUp, changePassword, EmptyUserInventory, deleteCurrentUser  } from "./authenticate.js"

document.getElementById("signInForm")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorBox = document.getElementById("signInError");

  function showError(message) {
    if (!errorBox) return;
    errorBox.textContent = message;
    errorBox.style.display = "block";
  }

  if (errorBox) {
    errorBox.style.display = "none"; // Skjul gamle feilmeldinger
  }

  if (!email || !password) {
    showError("Please enter both email and password.");
    return;
  }

  if (!email.includes("@")) {
    showError("Please enter a valid email address.");
    return;
  }

  signIn(email, password)
    .catch(() => {
      showError("Incorrect email or password.");
    });
});

document.getElementById("signUpForm")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const confPassword = document.getElementById("confPassword").value.trim();
  const errorBox = document.getElementById("signUpError");

  function showError(message) {
    if (!errorBox) return;
    errorBox.textContent = message;
    errorBox.style.display = "block";
  }

  if (errorBox) {
    errorBox.style.display = "none"; // Skjul gamle feilmeldinger
  }

  if (!username || !email || !password || !confPassword) {
    showError("Please fill in all the fields.");
    return;
  }

  if (password.length > 45 || username.length > 30) {
    showError("The Username or Password cannot be longer than 45 characters.");
    return;
  }

  if (password.length < 8) {
    showError("Password must be at least 8 characters long.");
    return;
  }

  if (password !== confPassword) {
    showError("Passwords do not match.");
    return;
  }

  if (!email.includes("@")) {
    showError("Please enter a valid email.");
    return;
  }

  // Alt er OK
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

 // <-- NYTT: Event listener for "Delete account" knappen
    const deleteAccountButton = document.getElementById("deleteButton"); // Bruker den nye ID-en
    if (deleteAccountButton) {
        deleteAccountButton.addEventListener("click", (e) => {
            e.preventDefault();
            deleteCurrentUser(); // Kall funksjonen for å slette brukeren
        });
    }



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

document.addEventListener("DOMContentLoaded", async () => {
  const changePasswordForm = document.getElementById("changePasswordForm");
  changePasswordForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById("currentPassword").value.trim();
    const newPassword = document.getElementById("newPassword").value.trim();
    const confirmNewPassword = document.getElementById("confirmNewPassword").value.trim();

    if (newPassword.length < 8) {
      alert("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmNewPassword){
      alert("The new passwords do not match");
      return;
    }

    try {
      changePassword(currentPassword, newPassword);
      alert("password updated successfully.");
    } catch (error) {
      alert("Failed to change password: " + error.message);
      console.error(error);
    }
  });
 });

document.addEventListener("DOMContentLoaded", async () => {
  const EmptyInventoryButton = document.getElementById("emptyInventoryButton");
  if (EmptyInventoryButton){
    EmptyInventoryButton.addEventListener("click", (e) =>{
      e.preventDefault();
      EmptyUserInventory();
    });
  };
});



