/**
 *@author Martin U
 *@author Martin N
 *@author Atle
*/

// Function to toggle the dropdown menu visibility
function dropdownFunction() {
  document.getElementById("menuDropdown").classList.toggle("show");
}

// This event listener closes the dropdown menu when clicking outside of it
document.addEventListener('click', function(e) {
  const menuDropdown = document.getElementById("menuDropdown");
  if (!e.target.closest('.dropbtn') && !menuDropdown.contains(e.target)) {
    menuDropdown.classList.remove('show');
  }
});

// Wait for the DOM to load before running this part
document.addEventListener("DOMContentLoaded", function () {
  // Select the menuButton element
  const menuButton = document.querySelector(".menuButton");
  // Select the sidebar element
  const sidebar = document.querySelector(".sidebar");

  // Toggle the sidebar visibility when the menu button is clicked
  menuButton.addEventListener("click", function (event) {
    // Prevent the click from bubbling up and triggering the document click event listener
    event.stopPropagation();
    // Toggle the 'show' class on the sidebar
    sidebar.classList.toggle("show");
  });

  // Close the sidebar if clicking outside of it
  document.addEventListener("click", function (event) {
    if (!sidebar.contains(event.target) && !menuButton.contains(event.target)) {
      sidebar.classList.remove("show");
    }
  });

  // Highlight the active page link in the navigation
  // Get the current page's filename (for example "index.html")
  const currentPage = window.location.pathname.split("/").pop();
  document.querySelectorAll("nav a").forEach(link => {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("active");
    }
  });
});


