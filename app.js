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
    events = data.items.map(event => ({
      title: event.summary || "Untitled Event",
      start: event.start.dateTime || event.start.date,
      location: event.location || "No location",
      description: event.description || "No description"
    }));

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
  list.innerHTML = Object.entries(grouped).map(([date, items]) => `
    <div class="date-header">${formatDate(date)}</div>
    ${items.map((event, index) => `
      <div class="event-card" onclick="openEventModal(${index})">
        <span style="width: 125px; display: inline-block;">${formatTime(event.start)}</span><strong>${event.title}</strong><br/>
        <span style="margin-left: 125px; display: inline-block;"> ${event.location}</span>
      </div>
    `).join("")}
  `).join("");
}

function groupEventsByDate(events) {
  return events.reduce((acc, event) => {
    const date = event.start.slice(0, 10);
    acc[date] = acc[date] || [];
    acc[date].push(event);
    return acc;
  }, {});
}

function formatDate(dateStr) {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateStr).toLocaleDateString(undefined, options);
}

function formatTime(dateStr) {
  const options = { hour: '2-digit', minute: '2-digit' };
  return new Date(dateStr).toLocaleTimeString(undefined, options);
}

function openEventModal(index) {
  const event = events[index];
  document.getElementById("modal-title").textContent = event.title;
  document.getElementById("modal-time").textContent = formatDate(event.start) + " at " + formatTime(event.start);
  document.getElementById("modal-location").textContent = event.location;
  document.getElementById("modal-description").textContent = event.description;
  document.getElementById("event-modal").style.display = "block";
}

function closeEventModal() {
  document.getElementById("event-modal").style.display = "none";
}

window.addEventListener("load", fetchCalendarEvents);
