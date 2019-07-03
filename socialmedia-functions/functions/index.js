const firebaseConfig = {
  apiKey: "AIzaSyB1jfmFdGCnPOd7Y-vPZ3xQCftrWr4I0xc",
  authDomain: "socialmedia-79dfc.firebaseapp.com",
  databaseURL: "https://socialmedia-79dfc.firebaseio.com",
  projectId: "socialmedia-79dfc",
  storageBucket: "socialmedia-79dfc.appspot.com",
  messagingSenderId: "1015890454635",
  appId: "1:1015890454635:web:f2219c3cae321940"
};

var admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://socialmedia-79dfc.firebaseio.com"
});

const functions = require('firebase-functions');
const app=require('express')();
//const {firebaseConfig}=require('./utils/config.js');

const FBAuth=require('./utils/fbAuth.js');
const {
  getAllScreams,
  postOneScream,
  getScream,
  deleteScream,
  commentOnScream,
  likeScream,
  unlikeScream,
}=require('./handlers/screams.js');

const {
  signUp,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser,
  getUserDetails,
  markNotificationsRead
}=require('./handlers/users.js');

const firebase=require('firebase');
firebase.initializeApp(firebaseConfig);

//Screams
app.get('/screams',getAllScreams);
app.post('/scream',FBAuth,postOneScream);
app.get('/scream/:screamId',getScream);
app.get('/scream/:screamId',deleteScream);
app.get('/scream/:screamId/like',FBAuth,likeScream);
app.get('/scream/:screamId/unlike',FBAuth,unlikeScream);
app.post('/scream/:screamId/comment',FBAuth,commentOnScream);

//User routes
app.post('/signup',signUp);
app.post('/login',login);
app.post('/user/uploadimage',FBAuth,uploadImage);
app.post('/user/adddetails',FBAuth,addUserDetails);
app.get('/user',FBAuth,getAuthenticatedUser);
app.get('/user/:handle',getUserDetails);
app.post('/notifications',FBAuth,markNotificationsRead);

exports.api=functions.https.onRequest(app);
//Notifications function
exports.createNotificationsForLike=functions.firestore.document(`likes/{id}`)
.onCreate(snapshot=>{
  admin.doc(`/screams/${snapshot.data().screamId}`).get()
  .then(doc=>{
    if(doc.exists() && doc.data().userHandle!==snapshot.data().userHandle){
      return admin.firestore.doc(`/notifications/${snapshot.id}`).set({
        createdAt:new Date().toISOString(),
        recipient:doc.data().userHandle,
        sender:snapshot.data().userHandle,
        screamId:doc.id,
        type:'like',
        read:'false'
      })
    }
  }).then(()=>{
    return;
  }).catch(error=>{
    console.error(error);
    return;
  })
})

exports.deleteNotificationsOnUnlike=functions.firestore.document('likes/{id}')
.onDelete(snapshot=>{
  admin.doc(`/notifications/${snapshot.id}`)
  .delete()
  .then(()=>{
    return;
  }).catch(error=>{
    console.error(error);
    return response.status(400).json({error:error.code});
  })
})

exports.createNotificationsForComment=functions.firestore.document('comments/{id}')
.onCreate(snapshot=>{
  admin.doc(`/screams/${snapshot.data().screamId}`).get()
  .then(doc=>{
    if(doc.exists() && doc.data().userHandle!==snapshot.data().userHandle){
      return admin.firestore.doc(`/notifications/${snapshot.id}`).set({
        createdAt:new Date().toISOString(),
        recipient:doc.data().userHandle,
        sender:snapshot.data().userHandle,
        screamId:doc.id,
        type:'comment',
        read:'false'
      })
    }
  }).then(()=>{
    return;
  }).catch(error=>{
    console.error(error);
    return;
  })
})
exports.onUserImageChange=functions.firestore.document(`/users/{userId}`)
.onUpdate((change)=>{
  if(change.before.data().imageUrl!==change.after.data().imageUrl){
  console.log(change.before.data());
  console.log(change.after.data());
  let batch=admin.firestore.batch();
  return admin.firestore.collection('screams').where('userhandle','==',change.before.data().handle)
  .get().then(data=>{
  data.forEach(doc=>{
    const scream=admin.firestore.doc(`/screams/${doc.id}`);
    batch.update(scream,{userImage:change.after.data().imageUrl});
  })
  return batch.commit();
  });
}
})

exports.onScreamDeleted=functions.firestore.document('/screams/{sreamId}').
onDelete((snapshot,context)=>{
  const screamId=context.params.screamId;
  const batch=admin.firestore.batch();
  return admin.firestore.collection('comments').where('screamId','==',screamId).get().then(data=>{
    data.forEach(doc=>{
      batch.delete(admin.firestore.doc(`/comments/${doc.id}`));
    })
    return admin.firestore.collections('likes').where('screamId','==',screamId).get();
  }).then(data=>{
  data.forEach(doc=>{
    admin.firestore.delete(`/likes/${doc.id}`);
  })
  return admin.firestore.collections('notifications').where('screamId','==',screamId).get();
}).then(data=>{
  data.forEach(doc=>{
    batch.delete(admin.firestore.doc(`/notifications/${doc.id}`));
})
return batch.commit();
}).catch(error=>{
  console.error(error);
  return response.status(400).json({error:error.code})
})
})
