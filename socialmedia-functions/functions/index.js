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

const FBAuth=require('./utils/fbAuth');
const {getAllScreams}=require('./handlers/screams.js');
const {postOneScream}=require('./handlers/screams.js');
const {
  signUp,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser,
  getScream,
  deleteScream,
  commentOnScream,
  likeScream,
  unlikeScream}=require('./handlers/users.js');

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

//user routes
app.post('/signup',signUp);
app.post('/login',login);
app.post('/user/uploadimage',FBAuth,uploadImage);
app.post('/user/adddetails',FBAuth,addUserDetails);
app.get('/user',FBAuth,getAuthenticatedUser);
exports.api=functions.https.onRequest(app)
