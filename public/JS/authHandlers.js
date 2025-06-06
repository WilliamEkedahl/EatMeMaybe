/**
 * @author Marius
 * @author Martin U
 * @author William
 *
 * The main responsibility of authHandler is to act as a middleware between the userInterface and the backend logic,
 * it handles error handling and listening after button presses or form submissions before running the desired function
 * in authenticate to execute the user requested authentication task.
*/

/**
 * Imports functions created in authenticate.js, that use the auth instance created in firestore.js
 */
import {signIn, logOut, signUp, changePassword, deleteUserInventory, deleteCurrentUser  } from "./authenticate.js"

/**SignIn() EVENT LISTENER
 *@author William
 * @author Marius (error handling messageBox)
 * Runs the firebase method signIn if none of the if statements are "activated"
 * Event listener that listens if the object exists ?., the form is submitted with the id "signInForm" it has 3 constants
 * email
 * password
 * signInError - A div where the error message is displayed.
 *
 * The error handling is styled to appear in the signIn form if an error is "triggered"
 *The information that the user writes into the email and password field is submitted as parameters in the signIn function
 * if the success scenario occurs.
 *
 * the error handling checks if both fields are filled in, if the email contains an @ symbol or if the password and email
 * are correct by using a catch() method to that is called when a promise is rejected.
 */

document.getElementById("signInForm")?.addEventListener("submit", (e) => { // Adds an event listener that triggers when the sign-in form is submitted
  e.preventDefault();  // Prevents the default form submission behavior (such as page reload)

  const email = document.getElementById("email").value.trim(); // Retrieves and trims the email input value
  const password = document.getElementById("password").value.trim(); // Retrieves and trims the password input value
  const errorBox = document.getElementById("signInError"); // Selects the element where error messages will be displayed

  function showError(message) { // If the error box doesn't exist, exit the function
    if (!errorBox) return;
    errorBox.textContent = message;// Set the error message
    errorBox.style.display = "block"; // Make the error box visible
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


/**
 * @Author William
 * @Author Marius (error handling messageBox)
 *
 * Event listener that adds an event listener if the element signUpForm exists (?.addEventListener)
 * the event listener has
 *5 constants
 * email
 * username
 * password
 * confPassword
 * it also has a error handling constant that displays error handling messages in a div in the signUpForm,
 * the success scenario activates when none of the error messages are triggered the requirements are that the username
 * and password has to be less than 45 characters, the password needs to be at least 8 characters long, the password and
 * confpassword input field texts need to match. The signUp method is run in the success scenarios with the parameter values
 * that are input by the user and copied into the email, username and password constants that are passed as parameters in
 * the signUp function.
 */
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


// Event listener for "signOut" knappen
   const signOutButton = ["signOutButtonSidebar", "signOutButtonDropdown"];

signOutButton.forEach(id => { // Loops first through each IDs
    const btn = document.getElementById(id); // Finds the button element by its id
    if (btn) {
        btn.addEventListener("click", (e) => { // Adds event listener for when button is clicked
            e.preventDefault();// Prevents the default action of the button (e.g., submitting a form or navigating).
            logOut(); //runs the function defined in authenticate.js
        });
    }
});

/**
 * @author Martin U
 * For defining the different IDs for "Delete account" bottons
 * One for sidebar and one for dropdown
 */
   
   const deleteButtonIds = ["deleteButtonSidebar", "deleteButtonDropdown"];

deleteButtonIds.forEach(id => { // Loops first through each IDs
    const btn = document.getElementById(id); // Finds the button element by its id
    if (btn) { // Goes through if button exists
        btn.addEventListener("click", (e) => { // Adds event listener for when button is clicked
            e.preventDefault(); // Prevents the default action of the button (e.g., submitting a form or navigating).
            deleteCurrentUser(); //runs the function defined in authenticate.js
        });
    }
});

/**
 * @author Marius
 * 
 */
  
   /**
    * For adding the eye icon and making it clickable to show or hide password
    * uses a toggle to switch between text field text and password styling to toggle between showing and hiding
    * the password.
    */
document.addEventListener("DOMContentLoaded", () => { 
  document.querySelectorAll(".toggle-password").forEach(toggle => { //Finds all elements that share the class "toggle password" (for example eye icon)
    toggle.addEventListener("click", () => { //Adds the ability to click each icon
      const input = document.getElementById(toggle.getAttribute("data-target")); // Fetches the ID to the input-field that the icon is going to check from "data target" attribute
      if (input.type === "password") { //if the input-field exists, toggle between showing and hiding the password
        input.type = "text";
      } else {
        input.type = "password";
      }
    });
  });
});

/**
 *@Author William
 * @Author Marius (error handling messageBox)
 * @author Martin U
 * Event listener for changePasswordForm
 */
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

/**
 *@author William
 *Eventlistener listening using DOMContentLoaded that has an async listener that waits for the whole webpage to load
 * before firing the event and returns promise<void> meaning an asynchronous action that does not produce a result.
 * It listens after a click on the button with id "deleteInventoryButton" on the index page. e.preventDefault() is
 * used to stop the default behaviour of the form. If the event listener registers it runs the method DeleteUserInventory()
 * that is imported from authenticate.js
 */
document.addEventListener("DOMContentLoaded", async () => {
  const EmptyInventoryButton = document.getElementById("deleteInventoryButton");
  if (EmptyInventoryButton){
    EmptyInventoryButton.addEventListener("click", (e) =>{
      e.preventDefault();
      deleteUserInventory();
    });
  }
});
