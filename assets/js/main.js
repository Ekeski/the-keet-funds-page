document.getElementById("hamburgerMenu").addEventListener("click", function () {
  document.getElementById("left-sidebar").classList.toggle("show-left-sidebar");
});

//logout button functionality
const logOutButton = document.getElementById("logOutButton");

logOutButton.addEventListener("click", () => {
  // Clear session storage
  sessionStorage.clear();
  // Redirect to login page
  window.location.href = "index.html";
});
