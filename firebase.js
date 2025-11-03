// Leaving this file but not implementing at the moment
// Import Firebase and messaging service
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCbJubEYeW3HVK2mmyrA3Suz2qdgPMyfo0",
  authDomain: "fpc-neptune.firebaseapp.com",
  databaseURL: "https://fpc-neptune.firebaseio.com",
  projectId: "fpc-neptune",
  storageBucket: "fpc-neptune.firebasestorage.app",
  messagingSenderId: "412324032446",
  appId: "1:412324032446:web:ebf8459bab0d8b215b13ef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Function to request permission and get the token for push notifications
async function requestNotificationPermission() {
  try {
    const status = await Notification.requestPermission();
    if (status === 'granted') {
      console.log('Notification permission granted.');
      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: 'BCYEkd1myoNjthrjIyR8gol-JeDJFS-2Ys8hhkDdyjV7lc3Dizm4-ye_B9sURmoDUl5mV6fQVDtwvKv8aOgSwAs' // Replace with your public VAPID key
      });
      console.log('FCM Token:', token);

      // Store the token in localStorage (optional)
      localStorage.setItem('fcm_token', token);
    } else {
      console.log('Notification permission denied.');
    }
  } catch (error) {
    console.error('Error getting notification permission or token:', error);
  }
}

// Handle incoming push messages
onMessage(messaging, (payload) => {
  console.log('Message received. ', payload);
  // You can customize how you handle incoming push notifications
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon
  };
  new Notification(notificationTitle, notificationOptions);
});

// Toggle switch state based on localStorage
const toggleSwitch = document.getElementById('notification-toggle');
toggleSwitch.checked = localStorage.getItem('notificationsEnabled') === 'true';

toggleSwitch.addEventListener('change', (event) => {
  if (event.target.checked) {
    // Enable notifications
    localStorage.setItem('notificationsEnabled', 'true');
    requestNotificationPermission();
  } else {
    // Disable notifications
    localStorage.setItem('notificationsEnabled', 'false');
    console.log('Notifications disabled');
  }
});

// Check for previously stored preference and set the switch accordingly
if (localStorage.getItem('notificationsEnabled') === 'true') {
  requestNotificationPermission();
}

