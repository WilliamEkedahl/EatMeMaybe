document.addEventListener("DOMContentLoaded", function () {
  const menuButton = document.querySelector(".menuButton");
  const sidebar = document.querySelector(".sidebar");

  menuButton.addEventListener("click", function (event) {
    event.stopPropagation(); // Hindrer at klikking på knappen lukker menyen
    sidebar.classList.toggle("show");
  });

  // Klikk utenfor sidebar for å lukke den
  document.addEventListener("click", function (event) {
    if (!sidebar.contains(event.target) && !menuButton.contains(event.target)) {
      sidebar.classList.remove("show");
    }
  });
});