importScripts("https://www.gstatic.com/firebasejs/8.2.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.2.0/firebase-messaging.js");

// Initialize the Firebase app in the service worker by passing the generated config
const firebaseConfig = {
    apiKey: "AIzaSyAzOJMwqKKNrsNrv7eDs-n8tImdLybeAG8",
    authDomain: "shopbyeth.firebaseapp.com",
    projectId: "shopbyeth",
    storageBucket: "shopbyeth.appspot.com",
    messagingSenderId: "187068353786",
    appId: "1:187068353786:web:f6879381ddecb7fa4d4d43",
    measurementId: "G-897NEF3453"
  };

  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();
  let url =""
  
  messaging.onBackgroundMessage(function(payload) {
    url = payload.data.click_action
    const notificationTitle = payload.data.title;
      const notificationOptions = {
        body: payload.data.body,
        icon: '/firebase-logo.png'
      };
     return self.registration.showNotification(notificationTitle,
      notificationOptions);
  });

  self.addEventListener('notificationclick', event => {
    clients.openWindow("https://shopbyeth.innovaturelabs.com"+url)
    return event;
  });