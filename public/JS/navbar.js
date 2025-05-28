
function dropdownFunction() {
  document.getElementById("menuDropdown").classList.toggle("show");
}
 
document.addEventListener('click', function(e) {
  const menuDropdown = document.getElementById("menuDropdown");
  if (!e.target.closest('.dropbtn') && !menuDropdown.contains(e.target)) {
    menuDropdown.classList.remove('show');
  }
});
 
document.addEventListener("DOMContentLoaded", function () {
  const menuButton = document.querySelector(".menuButton");
  const sidebar = document.querySelector(".sidebar");
 
  menuButton.addEventListener("click", function (event) {
    event.stopPropagation(); // Hindrer at klikk på knappen lukker menyen
    sidebar.classList.toggle("show");
  });
 
  // Klikk utenfor sidebar for å lukke den
  document.addEventListener("click", function (event) {
    if (!sidebar.contains(event.target) && !menuButton.contains(event.target)) {
      sidebar.classList.remove("show");
    }
  });
});
 
function hideSidebar() {
  const sidebar = document.querySelector(".sidebar");
  sidebar.classList.remove("show");
}