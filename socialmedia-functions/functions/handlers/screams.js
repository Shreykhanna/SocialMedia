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
