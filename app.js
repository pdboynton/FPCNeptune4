if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then(reg => {
      console.log("Service Worker registered:", reg.scope);
    }).catch(err => {
      console.error("Service Worker registration failed:", err);
    });
  });
}

// === Firebase Cloud Messaging Setup (embedded config, safe for frontend) ===

// Your public Firebase project settings
const firebaseConfig = {
  apiKey: "AIzaSyCbJubEYeW3HVK2mmyrA3Suz2qdgPMyfo0",
  authDomain: "fpc-neptune.firebaseapp.com",
  projectId: "fpc-neptune",
  messagingSenderId: "412324032446",
  appId: "1:412324032446:web:ebf8459bab0d8b215b13ef"
};

// Your PUBLIC VAPID key from Firebase Console → Cloud Messaging → Web Push certificates
const firebaseVapidKey = "BJMildhiI-lq1yYGwYXhnZeO-3hYClXId66QVCiyxn-zOchKYXDBhou-DeNHvzlGuDKJ3WAdzBNwQF_XOxMyRFg"; // 11-3-25 VAPID key

// Initialize Firebase (compat version for non-module usage)
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

async function enablePushNotifications() {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      showToast("Push notifications denied.");
      return;
    }

    const registration = await navigator.serviceWorker.ready;

    // Request an FCM token
    const token = await messaging.getToken({
      vapidKey: firebaseVapidKey,
      serviceWorkerRegistration: registration
    });

    if (token) {
      localStorage.setItem("fcmToken", token);
      console.log("✅ FCM Token:", token);
      showToast("Push notifications enabled.");
    } else {
      console.warn("⚠️ No FCM token returned. Check permissions or VAPID key.");
    }
  } catch (err) {
    console.error("❌ Error enabling push notifications:", err);
    showToast("Failed to enable push notifications.");
  }
}

function disablePushNotifications() {
  localStorage.removeItem("fcmToken");
  showToast("Push notifications disabled.");
}


// Waits until after DOM is finished loading
document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.getElementById("hamburger-menu");
  const sideMenu = document.getElementById("side-menu");
  const menuOverlay = document.getElementById("menu-overlay");
  const menuItems = document.getElementById("menu-items");
  const sections = document.querySelectorAll("#app section");
  const appEl = document.getElementById("app");
  const headerEl = document.querySelector(".home-header");

  // Close video modals
  document.getElementById("close-video-btn").addEventListener("click", closeVideoModal);

  // Toggle menu (drawer + backdrop together)
  hamburger.addEventListener("click", () => {
    sideMenu.classList.toggle("visible");
    menuOverlay.classList.toggle("visible");
  });

  // Tapping the backdrop closes the drawer, same as native nav drawers
  menuOverlay.addEventListener("click", () => {
    sideMenu.classList.remove("visible");
    menuOverlay.classList.remove("visible");
  });

  // Build menu from data-title / data-icon attributes on each section
  sections.forEach(section => {
    const title = section.dataset.title;
    const icon  = section.dataset.icon;
    if (!title) return;
    const li = document.createElement("li");
    li.innerHTML = icon ? `<i class="${icon}"></i> ${title}` : title;
    li.dataset.section = section.id;
    li.addEventListener("click", () => {
      navigateToSection(section.id);
      sideMenu.classList.remove("visible");
      menuOverlay.classList.remove("visible");
    });
    menuItems.appendChild(li);
  });

  // Give the header a subtle elevation once content scrolls beneath it
  // NOTE: #app is not a scroll container — the window scrolls, not the div.
  if (headerEl) {
    window.addEventListener("scroll", () => {
      headerEl.classList.toggle("scrolled", window.scrollY > 4);
    }, { passive: true });
  }

  // Lightweight skeleton placeholders shown until live data arrives
  renderSkeletonPlaceholders();

  // Show the section matching the URL hash (deep link), defaulting to Home.
  // Using replace (push:false) so the very first load doesn't add a history entry.
  const startId = (location.hash || "#home").slice(1);
  showSection(document.getElementById(startId) ? startId : "home", { push: false });

  // Settings toggles and sliders
  const fontSlider = document.getElementById("font-size-slider");
  const darkToggle = document.getElementById("dark-mode-toggle");

   // Font size scaling: 1 = 1.0, 2 = 1.25, 3 = 1.5
  const scaleMap = {
    1: 1.0,
    2: 1.25,
    3: 1.5
  };

  // On load — apply saved font scale if it exists
  const savedFontScaleValue = localStorage.getItem("fontScaleValue");
  if (savedFontScaleValue) {
    fontSlider.value = savedFontScaleValue;
    const scale = scaleMap[savedFontScaleValue];
    document.documentElement.style.setProperty("--text-scale", scale);
  }

  // When user moves the slider, apply and save the scale
  fontSlider.addEventListener("input", () => {
    const scale = scaleMap[fontSlider.value];
    document.documentElement.style.setProperty("--text-scale", scale);
    localStorage.setItem("fontScaleValue", fontSlider.value);
  });


  // Dark mode toggle
  darkToggle.addEventListener("change", () => {
    document.documentElement.classList.toggle("dark", darkToggle.checked);
    localStorage.setItem("darkMode", darkToggle.checked);
  });

  // Pull dark mode On load
  if (localStorage.getItem("darkMode") === "true") {
    document.documentElement.classList.add("dark");
    darkToggle.checked = true;
  }

  // ====== Reminders Toggle ======
  const remindersToggle = document.getElementById("reminders-toggle");

  // Load saved setting
  const remindersEnabled = localStorage.getItem("eventReminders") === "true";
  remindersToggle.checked = remindersEnabled;

  // Apply on load if already enabled
  if (remindersEnabled) {
    enableEventReminders();
  }

  remindersToggle.addEventListener("change", async () => {
    if (remindersToggle.checked) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        localStorage.setItem("eventReminders", "true");
        showToast("Event reminders enabled.");
        enableEventReminders();
      } else {
        remindersToggle.checked = false;
        showToast("Notification permission denied.");
      }
    } else {
      localStorage.setItem("eventReminders", "false");
      showToast("Event reminders disabled.");
      clearScheduledReminders();
    }
  });

  // ====== Push Notifications Toggle ======
  const pushToggle = document.getElementById("notification-toggle");

  // Load saved state
  pushToggle.checked = !!localStorage.getItem("fcmToken");

  pushToggle.addEventListener("change", async () => {
    if (pushToggle.checked) {
      await enablePushNotifications();
    } else {
      disablePushNotifications();
    }
  });
  
  // Data Management 
  const wipeBtn = document.getElementById("wipe-data-btn");
  const updateBtn = document.getElementById("update-now-btn");

  // Wipe localStorage and reload
  wipeBtn.addEventListener("click", () => {
    localStorage.clear();
    showToast("App data wiped. Reloading...");
    location.reload();
  });

  // Force PWA update
  updateBtn.addEventListener("click", () => {
    if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(reg => reg.update());
            showToast("Service Worker update triggered. Reloading...");
            setTimeout(() => location.reload(), 1500); // force reload from source
          });
    } else {
      showToast("No active Service Worker found.");
    }
  });
});

// Shows a section with a brief native-style fade/slide transition, updates the
// active state in the drawer, and (optionally) records the navigation in the
// browser/native history so the Android hardware back button works as expected.
function showSection(id, { push = true } = {}) {
  if (!document.getElementById(id)) id = "home";

  const sections = document.querySelectorAll("#app > section");
  sections.forEach(s => {
    s.style.display = "none";
    s.classList.remove("section-enter");
  });

  const target = document.getElementById(id);
  target.style.display = "block";
  // Force a reflow so the enter animation replays every time the section is shown
  void target.offsetWidth;
  target.classList.add("section-enter");

  document.getElementById("app").scrollTo({ top: 0, behavior: "auto" });
  setActiveMenuItem(id);

  if (push && location.hash.slice(1) !== id) {
    history.pushState({ section: id }, "", "#" + id);
  }
}

function navigateToSection(id) {
  showSection(id, { push: true });
}

function setActiveMenuItem(id) {
  document.querySelectorAll("#menu-items li").forEach(li => {
    li.classList.toggle("active", li.dataset.section === id);
  });
}

// Android back / iOS swipe-back inside median.co maps to browser history —
// keep the visible section in sync with it.
window.addEventListener("popstate", () => {
  const id = (location.hash || "#home").slice(1);
  showSection(id, { push: false });
});

// Shimmer placeholders shown briefly while the YouTube/Calendar APIs respond,
// so the app never shows a blank panel on first load.
function renderSkeletonPlaceholders() {
  const gallery = document.getElementById("youtube-gallery");
  if (gallery) {
    gallery.innerHTML = Array.from({ length: 6 }).map(() => `
      <div class="video-card">
        <div class="skeleton" style="aspect-ratio:16/9;border-radius:0;"></div>
        <div style="padding:0.6rem;">
          <div class="skeleton" style="height:14px;width:85%;margin-bottom:8px;"></div>
          <div class="skeleton" style="height:10px;width:45%;"></div>
        </div>
      </div>
    `).join("");
  }

  const agenda = document.getElementById("agenda-list");
  if (agenda) {
    agenda.innerHTML = Array.from({ length: 3 }).map(() => `
      <div style="padding:0.9rem 0.25rem;">
        <div class="skeleton" style="height:12px;width:35%;margin-bottom:10px;"></div>
        <div class="skeleton" style="height:16px;width:75%;"></div>
      </div>
    `).join("");
  }
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

    events = data.items.map((event, i) => {
      const isAllDay = !!event.start.date;

      let start;
      if (isAllDay) {
        // Interpret all-day events as local midnight, not UTC
        const [year, month, day] = event.start.date.split("-");
        start = new Date(year, month - 1, day, 0, 0, 0);
      } else {
        // Timed events already include timezone info in dateTime
        start = new Date(event.start.dateTime);
      }

      return {
        title: event.summary || "Untitled Event",
        start,
        location: event.location || "No location",
        description: event.description || "No description",
        isAllDay,
        index: i,
      };
    });

    localStorage.setItem("cachedEvents", JSON.stringify(events));
    renderAgenda();
    
    if (localStorage.getItem("eventReminders") === "true") {
      enableEventReminders();
    }

  } catch (err) {
    console.error("Failed to fetch events:", err);
    const cached = localStorage.getItem("cachedEvents");
    if (cached) {
      events = JSON.parse(cached).map((ev) => ({ ...ev, start: new Date(ev.start) }));
      renderAgenda();
    } else {
      document.getElementById("agenda-list").innerHTML = "<p>Unable to load events.</p>";
    }
  }
}

function groupEventsByDate(events) {
  return events.reduce((acc, event) => {
    const y = event.start.getFullYear();
    const m = String(event.start.getMonth() + 1).padStart(2, "0");
    const d = String(event.start.getDate()).padStart(2, "0");
    const key = `${y}-${m}-${d}`; // local day only
    acc[key] = acc[key] || [];
    acc[key].push(event);
    return acc;
  }, {});
}

function renderAgenda() {
  const grouped = groupEventsByDate(events);
  const list = document.getElementById("agenda-list");
  const sortedEntries = Object.entries(grouped).sort(([a], [b]) => new Date(a) - new Date(b));
    list.innerHTML = sortedEntries.map(([dateStr, items]) => {
    const [year, month, day] = dateStr.split("-");
    const dateObj = new Date(year, month - 1, day); // local midnight
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
  
}

function closeEventModal() {
  document.getElementById("event-modal").style.display = "none";
}

document.addEventListener("click", (e) => {
  const sideMenu = document.getElementById("side-menu");
  const hamburger = document.getElementById("hamburger-menu");
  const menuOverlay = document.getElementById("menu-overlay");

  if (
    sideMenu.classList.contains("visible") &&
    !sideMenu.contains(e.target) &&
    !hamburger.contains(e.target)
  ) {
    sideMenu.classList.remove("visible");
    menuOverlay.classList.remove("visible");
  }
});

// Single delegated outside-click handler for every modal.
// Registered once at module scope — no per-open listener accumulation.
document.addEventListener("click", (e) => {
  if (!e.target.classList.contains("modal")) return;
  const modal = e.target;
  // Stop the video iframe from continuing to play in the background
  if (modal.id === "video-modal") {
    const player = document.getElementById("video-player");
    if (player) player.src = "";
  }
  modal.style.display = "none";
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

let reminderTimers = [];

// Schedules notifications for upcoming events (within next 24 hours)
function enableEventReminders() {
  if (!("Notification" in window)) {
    showToast("Notifications not supported in this browser.");
    return;
  }

  clearScheduledReminders(); // prevent duplicates

  const now = Date.now();
  const cutoff = now + 24 * 60 * 60 * 1000; // next 24 hours

  events.forEach(event => {
    const time = event.start.getTime();
    if (time > now && time < cutoff) {
      const delay = time - now - (5 * 60 * 1000); // 5 minutes before
      if (delay > 0) {
        const timerId = setTimeout(() => {
          showEventNotification(event);
        }, delay);
        reminderTimers.push(timerId);
      }
    }
  });

  console.log(`Scheduled ${reminderTimers.length} reminders`);
}

function showEventNotification(event) {
  const title = "Upcoming Event Reminder";
  const body = `${event.title} at ${formatTime(event.start, event.isAllDay)}\n${event.location || ""}`;
  const icon = "/icons/icon-192.png"; // optional, path to your PWA icon

  // If Service Worker is active, use it (better UX)
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification(title, { body, icon });
    });
  } else {
    new Notification(title, { body, icon });
  }
}

function clearScheduledReminders() {
  reminderTimers.forEach(id => clearTimeout(id));
  reminderTimers = [];
}

window.addEventListener("load", fetchCalendarEvents);
