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
      2: 1.25,
      3: 1.5
    };
    const scale = scaleMap[fontSlider.value];
    document.documentElement.style.setProperty("--text-scale", scale);
  });

  // Dark mode toggle
  darkToggle.addEventListener("change", () => {
    document.documentElement.classList.toggle("dark", darkToggle.checked);
  });
  
  const wipeBtn = document.getElementById("wipe-data-btn");
  const updateBtn = document.getElementById("update-now-btn");

  // Wipe localStorage and reload
  wipeBtn.addEventListener("click", () => {
    localStorage.clear();
    alert("App data wiped. Reloading...");
    location.reload();
  });

  // Force PWA update
  updateBtn.addEventListener("click", () => {
    if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(reg => reg.update());
            showToast("Service Worker update triggered. Reloading...");
            setTimeout(() => location.reload(true), 1500); // force reload from source
          });
    } else {
      showToast("No active Service Worker found.");
    }
  });
});

function navigateToSection(id) {
  const sections = document.querySelectorAll("#app > section");
  sections.forEach(s => s.style.display = "none");
  document.getElementById(id).style.display = "block";
  document.getElementById("app").scrollTo({ top: 0, behavior: "smooth" });
}

function openModal(id) {
  const modal = document.getElementById(id);
  modal.style.display = "block";
  
  // Add outside click listener to the modal overlay
  modal.addEventListener("click", function handleClickOutside(e) {
    if (e.target.classList.contains("modal")) {
      closeModal(id);
      modal.removeEventListener("click", handleClickOutside);
    }
  });
}

function closeModal(id) {
  document.getElementById(id).style.display = "none";
}

//Video Gallery
const API_KEY = "AIzaSyDV34G66jQ58MBPBJq3MfmhZF8mOdifVqg";
const CHANNEL_ID = "UCobD9L76P50KVlZBfI8-XYA";
let allVideos = [];
let currentPage = 1;
const videosPerPage = 6;

async function getUploadsPlaylistId() {
  const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${API_KEY}`);
  const data = await res.json();
  return data.items[0].contentDetails.relatedPlaylists.uploads;
}

async function loadVideos() {
  const playlistId = await getUploadsPlaylistId();
  const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${API_KEY}`);
  const data = await res.json();
  allVideos = data.items;
  renderPage();
}

function renderPage() {
  const gallery = document.getElementById("youtube-gallery");

  const start = (currentPage - 1) * videosPerPage;
  const end = start + videosPerPage;
  const pageVideos = allVideos.slice(start, end);

  gallery.innerHTML = pageVideos.map(video => {
    const vidId = video.snippet.resourceId.videoId;
    const title = video.snippet.title;
    const published = new Date(video.snippet.publishedAt).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric"
    });
    const description = video.snippet.description.split("\n").slice(0, 2).join("<br>");

    return `
      <div class="video-card" onclick="openVideoModal('${vidId}')">
        <img src="${video.snippet.thumbnails.medium.url}" alt="${title}">
        <h3>${title}</h3>
        <p class="video-date">${published}</p>
        <!-- p class="video-description">${description}</p -->
      </div>
    `;
  }).join("");

  document.getElementById("page-indicator").textContent = `Page ${currentPage}`;
}

function changePage(direction) {
  const totalPages = Math.ceil(allVideos.length / videosPerPage);
  currentPage += direction;
  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;
  renderPage();
}

function openVideoModal(videoId) {
  const modal = document.getElementById("video-modal");
  const player = document.getElementById("video-player");
  player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  modal.style.display = "block";
  
  // Add outside click listener to the modal overlay
  modal.addEventListener("click", function handleClickOutside(e) {
    if (e.target.classList.contains("modal")) {
      closeVideoModal();
      modal.removeEventListener("click", handleClickOutside);
    }
  });
}

function closeVideoModal() {
  const modal = document.getElementById("video-modal");
  const player = document.getElementById("video-player");
  player.src = "";
  modal.style.display = "none";
}

window.addEventListener("load", loadVideos);

// Calendar
const CALENDAR_ID = "firstpentecostalchurch.com_e2hia2v3bc766ff9397qu3eqa8@group.calendar.google.com";
let events = [];

async function fetchCalendarEvents() {
  const now = new Date().toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?key=${API_KEY}&timeMin=${now}&singleEvents=true&orderBy=startTime`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    events = data.items.map((event, i) => {
    const isAllDay = !!event.start.date;
    const rawStart = event.start.dateTime || event.start.date;
    const start = isAllDay ? new Date(rawStart + "T12:00:00") // all-day events: safe local noon
      : new Date(new Date(rawStart).toLocaleString()); // force local time for timed events
      
    return {
      title: event.summary || "Untitled Event",
      start,
      location: event.location || "No location",
      description: event.description || "No description",
      isAllDay,
      index: i // store index
    };
  });

    localStorage.setItem("cachedEvents", JSON.stringify(events));
    renderAgenda();
  } catch (err) {
    console.error("Failed to fetch events:", err);
    const cached = localStorage.getItem("cachedEvents");
    if (cached) {
      events = JSON.parse(cached);
      renderAgenda();
    } else {
      document.getElementById("agenda-list").innerHTML = "<p>Unable to load events.</p>";
    }
  }
}

function renderAgenda() {
  const grouped = groupEventsByDate(events);
  const list = document.getElementById("agenda-list");
  list.innerHTML = Object.entries(grouped).map(([dateStr, items]) => {
    const dateObj = new Date(dateStr); // safely parse ISO date
    return `
      <div class="date-header">${formatDate(dateObj)}</div>
      ${items.map(event => `
        <div class="event-card" onclick="openEventModal(${event.index})">
          <span style="width: 125px; display: inline-block;">${formatTime(event.start, event.isAllDay)}</span><strong>${event.title}</strong><br/>
          <span style="margin-left: 125px; display: inline-block;"> ${event.location}</span>
        </div>
      `).join("")}
    `;
  }).join("");
}

function groupEventsByDate(events) {
  return events.reduce((acc, event) => {
    const dateKey = new Date(event.start.getFullYear(), event.start.getMonth(), event.start.getDate());
    const key = dateKey.toISOString().split("T")[0]; // ISO format for consistent grouping
    acc[key] = acc[key] || [];
    acc[key].push(event);
    return acc;
  }, {});
}

function formatDate(date) {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
}

function formatTime(date, isAllDay) {
  if (isAllDay) return "All day";
  const options = { hour: '2-digit', minute: '2-digit' };
  return date.toLocaleTimeString(undefined, options);
}

function openEventModal(index) {
  const event = events[index];
  if (!event) return;

  document.getElementById("modal-title").textContent = event.title;
  document.getElementById("modal-time").textContent =
    formatDate(event.start) + " at " + formatTime(event.start, event.isAllDay);
  document.getElementById("modal-location").textContent = event.location;
  document.getElementById("modal-description").textContent = event.description;
  document.getElementById("event-modal").style.display = "block";
  
  // Add outside click listener to the modal overlay
  const modal = document.getElementById("event-modal");
  modal.addEventListener("click", function handleClickOutside(e) {
    if (e.target.classList.contains("modal")) {
      closeEventModal();
      modal.removeEventListener("click", handleClickOutside);
    }
  });
}

function closeEventModal() {
  document.getElementById("event-modal").style.display = "none";
}

document.addEventListener("click", (e) => {
  const sideMenu = document.getElementById("side-menu");
  const hamburger = document.getElementById("hamburger-menu");

  if (
    sideMenu.classList.contains("visible") &&
    !sideMenu.contains(e.target) &&
    !hamburger.contains(e.target)
  ) {
    sideMenu.classList.remove("visible");
  }
});

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("visible");
  }, 10);

  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

window.addEventListener("load", fetchCalendarEvents);