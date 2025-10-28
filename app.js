if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then(reg => {
      console.log("Service Worker registered:", reg.scope);
    }).catch(err => {
      console.error("Service Worker registration failed:", err);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.getElementById("hamburger-menu");
  const sideMenu = document.getElementById("side-menu");
  const menuItems = document.getElementById("menu-items");
  const sections = document.querySelectorAll("#app section");

  // Toggle menu
  hamburger.addEventListener("click", () => {
    sideMenu.classList.toggle("visible");
  });

  // Build menu from sections
  sections.forEach(section => {
    const heading = section.querySelector("h1");
    if (heading) {
      const icon = heading.querySelector("i")?.outerHTML || "";
      const text = heading.textContent.trim();
      const li = document.createElement("li");
      li.innerHTML = `${icon} ${text}`;
      li.style.cursor = "pointer";
      li.addEventListener("click", () => {
        sections.forEach(s => s.style.display = "none");
        section.style.display = "block";
        sideMenu.classList.remove("visible");
      });
      menuItems.appendChild(li);
    }
  });

  // Show home by default
  sections.forEach(s => s.style.display = "none");
  const home = document.getElementById("home");
  if (home) home.style.display = "block";

  // Settings toggles and sliders
  const fontSlider = document.getElementById("font-size-slider");
  const darkToggle = document.getElementById("dark-mode-toggle");

  // Font size scaling: 1 = 1.0, 2 = 1.05, 3 = 1.1
  fontSlider.addEventListener("input", () => {
    const scaleMap = {
      1: 1.0,
      2: 1.05,
      3: 1.1
    };
    const scale = scaleMap[fontSlider.value];
    document.documentElement.style.setProperty("--text-scale", scale);
  });

  // Dark mode toggle
  darkToggle.addEventListener("change", () => {
    document.documentElement.classList.toggle("dark", darkToggle.checked);
  });
});

li.addEventListener("click", () => {
  // Hide all sections
  sections.forEach(s => s.style.display = "none");

  // Show the selected section
  section.style.display = "block";

  // Scroll to top of the app container
  document.getElementById("app").scrollTo({ top: 0, behavior: "smooth" });

  // Close the menu
  sideMenu.classList.remove("visible");
});

function navigateToSection(id) {
  const sections = document.querySelectorAll("#app > section");
  sections.forEach(s => s.style.display = "none");
  document.getElementById(id).style.display = "block";
  document.getElementById("app").scrollTo({ top: 0, behavior: "smooth" });
}

function openModal(id) {
  document.getElementById(id).style.display = "block";
}

function closeModal(id) {
  document.getElementById(id).style.display = "none";
}
