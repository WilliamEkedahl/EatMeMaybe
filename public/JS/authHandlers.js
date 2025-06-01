import {signIn, logOut, signUp, changePassword, DeleteUserInventory, deleteCurrentUser  } from "./authenticate.js"

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

document.getElementById("signUpForm")?.addEventListener("submit", async (e) => {
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

  // Endret her: legg til try/catch for å fange feil fra signUp
  try {
    await signUp(email, username, password);
  } catch (error) {
    // Viser kun generell feilmelding uten å avsløre detaljer
    showError("Registration failed. Try again later.");
  }
});

// Event listener for "Delete account" knappen
   const signOutButton = ["signOutButtonSidebar", "signOutButtonDropdown"];

signOutButton.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            logOut();
        });
    }
});

 // Event listener for "Delete account" knappen
   const deleteButtonIds = ["deleteButtonSidebar", "deleteButtonDropdown"];

deleteButtonIds.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            deleteCurrentUser();
        });
    }
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

document.addEventListener("DOMContentLoaded", () => {
  const changePasswordForm = document.getElementById("changePasswordForm");
  const messageBox = document.getElementById("passwordMessage");

  
  // Koden inni denne blokken vil KUN kjøre hvis man er på change password siden.
  if (changePasswordForm && messageBox) {
    function showMessage(text, type) {
      messageBox.textContent = text;
      messageBox.className = ""; // Reset klasser
      messageBox.classList.add(type === "success" ? "success" : "error");
    }

    // Denne linjen vil nå bare kjøre hvis changePasswordForm IKKE er null
    changePasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const currentPassword = document.getElementById("currentPassword").value.trim();
      const newPassword = document.getElementById("newPassword").value.trim();
      const confirmNewPassword = document.getElementById("confirmNewPassword").value.trim();

      if (newPassword.length < 8) {
        showMessage("New password must be at least 8 characters long.", "error");
        return;
      }

      if (newPassword !== confirmNewPassword) {
        showMessage("The new passwords do not match.", "error");
        return;
      }

      try {
        // Antar at 'changePassword' funksjonen er definert andre steder (f.eks. i Firebase-integrasjonen)
        await changePassword(currentPassword, newPassword);
        showMessage("Password updated successfully.", "success");
        changePasswordForm.reset();
      } catch (error) {
        if (error.code === "auth/invalid-credential") {
          showMessage("Current password is incorrect.", "error");
        } else {
          showMessage("Failed to change password: " + error.message, "error");
        }
        console.error(error);
      }
    });
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  const EmptyInventoryButton = document.getElementById("deleteInventoryButton");
  if (EmptyInventoryButton){
    EmptyInventoryButton.addEventListener("click", (e) =>{
      e.preventDefault();
      DeleteUserInventory();
    });
  }
});
