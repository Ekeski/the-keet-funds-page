

document.getElementById("hamburgerMenu").addEventListener("click", function(){
    document.getElementById("left-sidebar").classList.toggle("show-left-sidebar");
})

// highlight current menu item
//   const links = document.querySelectorAll("nav a, .sidebar a"); 
//   links.forEach(link => {
//     if (link.href === window.location.href) {
//       link.classList.add("active");
//     }
//   });

//  const links = document.querySelectorAll("nav a, .sidebar a, li a");

//   links.forEach(link => {
//     if (link.href === window.location.href) {
//       link.parentElement.id = "active";  // assign id to the <li>
//     }
//   });