import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage,deleteToken } from "firebase/messaging";
import { toast } from "react-toastify";
const base_url = process.env.REACT_APP_API_ENDPOINT;
const vapidKey = process.env.FIREBASE_VAPID_KEY;
const firebaseConfig = {
  apiKey: "AIzaSyAzOJMwqKKNrsNrv7eDs-n8tImdLybeAG8",
    authDomain: "shopbyeth.firebaseapp.com",
    projectId: "shopbyeth",
    storageBucket: "shopbyeth.appspot.com",
    messagingSenderId: "187068353786",
    appId: "1:187068353786:web:f6879381ddecb7fa4d4d43",
    measurementId: "G-897NEF3453"
};

initializeApp(firebaseConfig);
const messaging = getMessaging();

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log("onmessage called", payload);
      const notificationTitle = payload.data.body;
       var options={
          body:payload.data.body
       }
       const notification =new Notification(payload.data.title,options)
       notification.onclick = ()=>{
        console.log("works");
        window.open("https://shopbyeth.innovaturelabs.com"+payload.data.click_action)
       }
      resolve(1);
    })
  });
  
// export const deleteTokens=() =>{
//   return new Promise((resolve, reject) => {
//     deleteToken(messaging).then((res=>{
//       console.log(res,"Token deleted");
//       resolve(1)
//     })).catch(((error)=>{
//       resolve(error)
//     }));
//   })
    

// }

export const requestForToken = async (axios) => {
  const deviceToken=localStorage.getItem("FirebaseToken")
  await getToken(messaging, { vapidKey: "BHyj6yajXssfF3n2o0_BM3EBkIo-q7TIxYBw9NEdciGKkxOO9v5OQv2vAOvh_HtIASdMALDitNR8Ev-dI5_dvlM" })
    .then((firebaseToken) => {  
      console.log("token", firebaseToken);
      if(deviceToken!==firebaseToken){
      localStorage.setItem("FirebaseToken",firebaseToken)
      sendNotificationToken(firebaseToken,axios);
      }
    })
    .catch((err) => {
      console.error("error",err);
    });
};

export const sendNotificationToken = async (firebaseToken,axios) => {
  let path=base_url + "users/me/notification/token";
  let body = {
    deviceToken: firebaseToken
  }
  await axios
    .patch(path, body)
    .then(() => {
      console.log("success");
    })
    .catch((err) => {
      console.log(err);
    });
};