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
    event.stopPropagation();
    sidebar.classList.toggle("show");
  });

  document.addEventListener("click", function (event) {
    if (!sidebar.contains(event.target) && !menuButton.contains(event.target)) {
      sidebar.classList.remove("show");
    }
  });

  const currentPage = window.location.pathname.split("/").pop();
  document.querySelectorAll("nav a").forEach(link => {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("active");
    }
  });
});


