
//const {admin,db}=require('../utils/admin');
const firebase=require('firebase');
//const {firebaseConfig}=require('../utils/config');
const{validateSignUpData,validateLoginData,reduceUserDetails}=require('../utils/validators');
const admin=require('firebase-admin');
const firebaseConfig = {
  apiKey: "AIzaSyB1jfmFdGCnPOd7Y-vPZ3xQCftrWr4I0xc",
  authDomain: "socialmedia-79dfc.firebaseapp.com",
  databaseURL: "https://socialmedia-79dfc.firebaseio.com",
  projectId: "socialmedia-79dfc",
  storageBucket: "socialmedia-79dfc.appspot.com",
  messagingSenderId: "1015890454635",
  appId: "1:1015890454635:web:f2219c3cae321940"
};
exports.signUp=(request,response)=>{
const newUser={
  email:request.body.email,
  password:request.body.password,
  confirmpassword:request.body.confirmpassword,
  handle:request.body.handle
};
const {valid,errors}=validateSignUpData(newUser);
if(!valid) return response.status(400).json(errors);

//Validate data
let token,userId;
let noimage='placeholder.png';
admin.firestore().doc(`/user/${newUser.handle}`)
.get()
.then((doc)=>{
  if(doc.exists){
    return response.status(400).json({handle:'This handle is already taken'});
  }else{
    return firebase.auth().createUserWithEmailAndPassword(newUser.email,newUser.password);
  }
}).then(data=>{
  userId=data.user.uid;
  return data.user.getIdToken();
}).then(idtoken=>{
  token=idtoken;
  const userCredentials={
    handle:newUser.handle,
    email:newUser.email,
    createdAt:new Date().toISOString(),
    imageurl:`https://firebasestorage.google.apis.com/v0/b/${firebaseConfig.storageBucket}/o/${noimage}?alt=media`,
    userId
  };
  return admin.firestore().doc(`/user/${newUser.handle}`).set(userCredentials);
}).then(()=>{
  return response.status(201).json({token:token});
}).catch((error)=>{
  console.error(error);
  if(error.code==='auth/email-already-in-use'){
    return response.status(400).json({email:'Email already in use'});
  }else{
    return response.status(500).json({error:error.code});
  }
});
}
exports.login=(request,response)=>{
  const user={
    email:request.body.email,
    password:request.body.password
  };

  const {valid,errors}=validateLoginData(user);
  if(!valid) return response.status(400).json(errors);

  firebase.auth().signInWithEmailAndPassword(user.email,user.password)
  .then(data=>{
    return data.user.getIdToken();
  }).then(token=>{
    return response.json(token);
  }).catch(error=>{
    console.error(error);
    return response.status(500).json({error:error.code});
  })
}
exports.addUserDetails=(request,response)=>{
let userDetails=reduceUserDetails(request.body);

admin.firestore().doc(`user/${newUser.handle}`).update(userDetails)
.then(()=>{
  return response.json({message:`Details added successfully`});
}).catch(error=>{
  console.error(error);
  return response.status(400).json({error:error.code});
})
}

//Get Own user details
exports.getAuthenticatedUser=(request,response)=>{
  let userIdData={};
  admin.firestore().doc(`/user/${request.user.handle}`).get()
  .then(doc=>{
    if(doc.exists)
    {
      userData.credentials=doc.data();
      return admin.firestore().collection('likes').where('userHandle','==',request.user.handle).get();
    }
  }).then(data=>{
    userData.likes=[];
    data.forEach(doc=>{
      userData.likes.push(doc.data());
    });
    return response.json(userData);
  })
  .catch(error=>{
    console.error(error);
    return response.status(500).json({error:error.code});
  })
}

//Function to uploadImage
exports.uploadImage=(request,response)=>{
  const BusBoy=require('busboy');
  const path=require('path');
  const os=require('os');
  const fs=require('fs');
  let imageFilename;
  let imageToBeUploaded;

  const busboy=new BusBoy({headers:requests.headers});
  busboy.on('file',function(fieldname,file,filename,encoding,mimetype){
    console.log(fieldname);
    console.log(filename);
    console.log(mimetype);
  //image.png
  if(mimetype!=='image/png' || mimetype!=="image/jpeg"){
    return response.status(400).json({message:"Wrong file submitted"});
  }
  const imageExtension=filename.split('.')[filename.split('.').length-1];
  imageFilename=`${Math.round(Math.random()*1000000000)}.${imageExtension}`;
  const filepath=path.join(os.tempdir(),imageFilename);
  imageToBeUploaded={filepath,mimetype};
  file.pipe(fs.createWriteStream(filepath));
});
busboy.on('finish',function(){
  admin.storage().bucket().upload(imageToBeUploaded.filepath,{
    resumable:false,
    metadata:{
      metadata:{
        contentType:imageToBeUploaded.mimetype
      }
    }
  }).then(()=>{
    const imageUrl=`https://firebasestorage.google.apis.com/v0/b/${firebaseConfig.storageBucket}/o/${imageFilename}?alt=media`;
    return db.doc(`/users/${req.user.handle}`).update({imageUrl:imageUrl});
  })
  .then(()=>{
    return response.json({message:`Image uploaded successfully`});
  })
}).catch(error=>{
  console.error(error);
  return response.status(400).json({error:error.code});
})
response.writeHead(404);
response.end();
}
//getAllScreams function
exports.getScream=(request,response)=>{
  let screamData={};
  admin.firestore().doc(`/user/${request.param.screamId}`).get()
  .then(doc=>{
    if(!doc.exists())return response.status(400).json({message:"Scream not found "})

    screamData=doc.data();
    screamData.screamId=doc.id;
    return admin.firestore().collection('comments').orderby('createdAt','desc').where('screamId','==',request.params.screamId).get();
  })
  .then(data=>{
    screamData.comments=[];
    data.forEach(doc=>{
    screamData.comments.push(doc.data());
    })
    return response.json(screamData);
  }).catch(error=>{
    console.log(error);
    return response.status(400).json({error:error.code});
  })
}

//commentOnScream function
exports.commentOnScream=(request,response)=>{
  if(request.body.body.trim()==='')return response.status(400).json({error:'Must not be empty'});
  const newComment={
    body:request.body.body,
    createdAt:new Date().toISOString(),
    screamId:request.params.screamId,
    userHandle:request.user.handle,
    userImage:request.user.imageUrl
  }
  admin.firestore().doc(`/user/${request.params.screams}`).get()
  .then(doc=>{
    if(!doc.exists()){
      return request.status(404).json({error:"Scream Does not exists"});
    }
    return admin.firestore().ref.update({commentCount:doc.data().commentCount+1});
  }).then(()=>{
    return request.json(newComment);
  }).then(()=>{
    request.json(newComment)
  })
  .catch(error=>{
    console.error(error);
    return request.status(500).json({error:error.code});
  })
}

//likeScream function
exports.likeScream=(request,response)=>{
const likeDocument=admin.firestore().collection('likes').where('userHandle','==',request.user.handle)
.where('screamId','==',request.params.screamId).limit(1);

const screamDocument=admin.firestore().collection(`/screams/${request.params.screamId}`);

let screamData;
screamDocument.get().then((doc)=>{
  if(doc.exists){
    screamData=doc.data();
    screamData.screamId=doc.id;
    return likeDocument.get();
  }else{
      return response.status(404).json({error:"Scream not found"});
  }
}).then(data=>{
  if(data.empty){
    return admin.firestore().collection('likes').add({
      screamId:request.params.screamId,
      userHandle:request.user.handle
    }).then(()=>{
      screamData.likeCount++;
      return screamDocument.update({likeCount:screamData.likeCount})

    }).then(()=>{
      return response.json(screamData);
    })
  }else{
    return response.json({error:'Scream already liked'});
  }
})
.catch(error=>{
  console.error(error);
  response.status(500).json({error:error.code});
})
}
//unlikeScream function
exports.unlikeScream=(request,response)=>{
  let screamData;
  screamDocument.get().then((doc)=>{
    if(doc.exists){
      screamData=doc.data();
      screamData.screamId=doc.id;
      return likeDocument.get();
    }else{
        return response.status(404).json({error:"Scream not found"});
    }
  }).then(data=>{
    if(data.empty){
      return response.json({error:'Scream not liked'})
    }else{
      admin.firestore().doc(`/likes/${data.docs[0].id}`).delete()
      .then(()=>{
        screamData.likeCount--;
        return screamDocument.update({likeCount:screamData.likeCount});
      })
      .then(()=>{
        return response.json(screamData);
      })
    }
  })
  .catch(error=>{
    console.error(error);
    response.status(500).json({error:error.code});
  })
}
//Deletescream function
exports.deleteScream=(request,response)=>{
  const document=admin.firestore().doc(`/screams/${request.params.screamId}`);
  document.get().then(doc=>{
    if(!doc.exists())return response.status(404).json({error:'Scream not found'});
    if(doc.data().userHandle!==request.params.handle){
      return response.status(403).json({error:"Unauthorized"})
    }else{
      return document.delete();
    }
}).then(()=>{
  return response.json({messsge:"Scream deleted"});
}).catch(error=>{
  console.error(error);
  return response.status(400).json({error:error.code});
})
}
