//const {db}=require('../utils/admin');
const admin=require('firebase-admin');

exports.getAllScreams=(request,response)=>{
  admin.firestore()
  .collection('screams')
  .orderBy('createdAt','desc')
  .get()
  .then((data)=>{
    let screams=[];
    data.forEach(doc=>{
      screams.push({
          screamId:doc.id,
          body:doc.data().body,
          userHandle:doc.data().userHandle,
          createdAt:doc.data().createdAt,
          commentCount:doc.data().commentCount,
          likeCount:doc.data().likeCount
      });
    });
    return response.json(screams);
  })
  .catch((err)=>console.error(err));
};

exports.postOneScream=(request,response)=>{
  const newScream={
    body:request.body.body,
    userHandle:request.user.userHandle,
    createdAt:admin.firestore.Timestamp.fromDate(new Date()),
    userImage:request.user.imageUrl,
    createdAt:new Date().toISOString(),
    likeCount:0,
    commentCount:0
};
  admin.firestore().collection('screams').add(newScream).then(doc=>{
    const resScream=newScream;
    resScream.screamId=doc.id;
    response.json(resScream);
  }).catch(err =>{
    response.status(500).json({error:"something went wrong"});
    console.error(err);
  })
};
//GetAllScreams function
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

//CommentOnScream function
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

//LikeScream function
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
//UnlikeScream function
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
