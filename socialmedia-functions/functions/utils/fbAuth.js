const{admin,db}=require('./admin');

module.exports=(request,response,next)=>{
  let IDtoken;
  if(request.header.authorization && request.headers.authorization.startsWith('Bearer ')){
    IDtoken=request.header.authorization.split('Bearer ')[1];
  }else{
    console.error("Token not found");
    return response.status(403).json({error:"Unauthorized"});
  }
admin.auth().verifyIdtoken(IDtoken).then(decodedtoken=>{
  request.user=decodedtoken;
  console.log(decodedtoken);
  return db.collection('users').where('userId','==',request.user.uid).limit(1).get();
})
.then(data=>{
  request.user.handle=data.docs[0].data().handle;
  request.user.imageUrl=data.docs[0].data().imageUrl;
  return next();
}).catch(error=>{
  console.log("Error while verifying token");
  return response.status(403).json(error);
})
}
