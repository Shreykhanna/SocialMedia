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
    //userHandle:reuquest.user.handle
    userHandle:request.body.userHandle,
    createdAt:admin.firestore.Timestamp.fromDate(new Date())
  };
  admin.firestore().collection('screams').add(newScream).then(doc=>{
    response.json({message:`document ${doc.id} created successfully`})
  }).catch(err =>{
    response.status(500).json({error:"something went wrong"});
    console.error(err);
  })
};
