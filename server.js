const fs = require('fs');
const express  = require('express');
const cors = require('cors');
const app = express();

const path = require('path');
const bodyParser = require('body-parser');  // for parsing data sent in a post request
// const redisStore = require('connect-redis')(session); // for accessing session data in socket
app.use(cors());
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  log: false,
  agent: false,
  origins: '*:*',
  transports: ['websocket', 'htmlfile', 'xhr-polling', 'jsonp-polling', 'polling']
});
io.set('origins', '*:*')
const session = require('express-session')({
    // store: new redisStore({}),
    secret: '41a6a4e1b30d55c3295bbc36230a5742', // md5 hash of 'chat_system'
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}); // for session management in node.js
const sharedsession = require("express-socket.io-session");
// const fileUpload = require('express-fileupload');
const siofu = require("socketio-file-upload");
const md5 = require('md5');
const msgStatusCodes = require('./msgStatusCodes');

const appRootDir = __dirname;
const srcDir = path.join(__dirname, "./src/");
const publicDir = path.join(__dirname, "./public/");
const uploadsDir = path.join(__dirname, "./uploads/");

const db = require("./db");

var socketData = {};

db.connect();

app.use(session);

// io.use(function(socket, next) {
//   sessionMiddleware(socket.request, socket.request.res, next);
// });


// app.use(sessionMiddleware);
// app.use(session);
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
// app.use(fileUpload());
app.use(siofu.router);
// server.use(cors());

app.use("/public", express.static(publicDir));
app.use("/uploadedFiles", express.static(uploadsDir));

io.use(sharedsession(session, {
  autoSave:true
}));

app.get("/", async (req, res) => {
  // console.log(req.session);
  // req.session.destroy();
  if(req.session.user) {
    let result = await db.getFriendsIDs(req.session.user.id);
    req.session.user.friendsIDs = result[0].friendsIDs;
    req.session.user.sessionResumed = true;
    res.sendFile(path.join(srcDir, "./html/user.html"));
  } else {
    res.sendFile(path.join(srcDir, "./html/login.html"));
  }
});

app.get("/signupPage", (req, res) => {
  res.sendFile(path.join(srcDir, "./html", "./signup.html"));
  // db.checkUserTable();
});

// app.set('jsonp callback', true);
// app.set('jsonp callback name', 'serverResponse');

app.post("/signup", async (req, res) => {
  const email = req.body.email;
  const username = req.body.username;
  const password = req.body.password;

  const user = {
    email: email,
    username: username,
    password: password
  };

  let response = await db.addUser(user);
  // console.log(response);
  res.send(JSON.stringify(response));
});

app.post("/login", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const user = {
    email: email,
    password: password
  };

  let result = await db.verifyUser(user);
  // console.log(response);
  let response = {};

  if (result.length == 1) { // match in database
    // console.log(result);
    // res.sendStatus(401);
    // return;
    req.session.user = {
      id: result[0].id,
      email: email,
      name: result[0].username,
      friendsIDs: result[0].friendsIDs
    };
    res.sendFile(path.join(srcDir, "./html", "./user.html"));
  } else {
    res.sendStatus(401);
  }
});

// app.post("/uploadFiles", (req, res) => {
//   if(req.session.user) {
//     if(req.files.uploadedFiles instanceof Array) {
//       req.files.uploadedFiles.forEach(file => { // multiple files
//         file.mv( path.join(uploadsDir, file.name), function(err) {
//           if (err)
//             return res.status(500).send(err);
//         });
//       });
//       // res.send('<script>alert("Files uploaded!")</script>');
//       res.sendStatus(200);
//     } else {  // single file
//       let file = req.files.uploadedFiles;
//       file.mv( path.join(uploadsDir, file.name), function(err) {
//         if (err)
//           return res.status(500).send(err);
//         // res.send('<script>alert("File uploaded!")</script>');
//         res.sendStatus(200);
//       });
//     }
//   }
// });
// app.post("/search", async (req, res) => {
//   const keyword = req.body.keyword;
//   console.log(keyword);
//   if (req.session.email) {
//     let result = await db.searchUser(keyword, req.session.email);
//     console.log(result);
//     res.sendStatus(403);
//   } else {
//     res.sendStatus(403);  // Forbidden
//   }
// });

// IO (socket) connection handler

io.on("connection", (client) => {
  var uploader = new siofu();
  uploader.dir = uploadsDir;
  uploader.listen(client);

  // Do something when a file is saved: 
  uploader.on("saved", function(event){
    client.emit('file-saved', {
      name: event.file.name,
      url: `/uploadedFiles/${event.file.name}`
    });
  });

  // Error handler: 
  uploader.on("error", function(event){
      console.log("Error from uploader", event);
  });

  let user = client.handshake.session.user;
  console.log('connected');
  if (user && user.id)
    client.broadcast.emit('connected', {
      id: user.id
    });

  client.on("store-socket-id", (data) => {
    if(user) {
      socketData[user.id] = client.id;
      client.emit('session-id-stored', user);
    }
  });

  client.on('get-friends-list', async data => {
    let friendsData = [];
    let ids = user.friendsIDs.replace(/;/g, ",");
    let result = await db.getFriendsData(ids);
    console.log(result);
    client.emit('friends-list', result);
  });

  client.on('get-groups-list', async data => {
    let result = await db.getGroupsList(user.id);
    console.log(result);
    client.emit('groups-info', result);
  });

  client.on('get-chat', async id => {
    let result = await db.getChat({
      senderID: user.id,
      receiverID: id
    });
    
    client.emit('chat', {
      id: id,
      sent: result.sent,
      received: result.received
    });
  });

  client.on("search-user", async (keyword) => {
    console.log(keyword);
    let result = await db.searchUser(keyword, user.email);
    // console.log(result);
    client.emit('search-result', result);
  });

  client.on('is-online', (id) => {
    // console.log(id);
    // console.log(socketData);
    if(socketData[id]) {    // user is online
      // console.log(socketData[id]);
      client.emit('user-online', { 
        socketId: socketData[id],
        id: id
      });
    } else {  // user is offline
      client.emit('user-offline', id);
    }
  });

  client.on('msg', async data => {
    let msg = data.msg;
    let msgID = data.msgID;
    let id = data.targetUserID;
    let msgType = data.msgType;
    let isFriend = data.isFriend;
    let msgStatusCode;

    let sender = null;
    if(!isFriend) {
      sender = await db.makeFriends({
        id: user.id,
        targetID: id
      });
      client.emit('friend-added', id);
    }

    if(socketData[id]) {    // online
      if(isFriend)
        client.broadcast.to(socketData[id]).emit('msg', {
          message: msg,
          messageID: msgID,
          msgType: msgType,
          senderID: user.id,
          senderName: user.name,
          isFriend: isFriend
        });
      else
        client.broadcast.to(socketData[id]).emit('msg', {
          message: msg,
          messageID: msgID,
          msgType: msgType,
          senderID: user.id,
          senderName: user.name,
          isFriend: isFriend,
          senderMail: sender.email
        });
      msgStatusCode = msgStatusCodes.pushed;
    } else {    // Offline
      msgStatusCode = msgStatusCodes.needsPush;
    }

    let response = await db.saveMsg({
      senderID: user.id,
      receiverID: id,
      msg: msg,
      msgID: msgID,
      msgType: msgType,
      status: msgStatusCode
    });

    // client.emit('msg-status', {
    //  msgStatusCode: msgStatusCode,
    //  response: response 
    // });

  });

  client.on('msg-ack', data => {
    console.log(data);
    let msgID = data.messageID;
    let id = data.senderID;
    if(data.updateDB) {
      db.updateMsgStatus({
        msgID: msgID
      });
    }

    client.broadcast.to(socketData[id]).emit('msg-ack', {
      msgID: msgID
    });
  });

  client.on('delete-msgs', async data => {
    console.log(data);
    let msgIDs = "(";
    for(let i = 0; i < data.length; i++) {
      msgIDs += `'${data[i].msgID}',`;
      if(data[i].msgType) { // implies its an attachment
        fs.unlink(path.join(__dirname, "./uploads", decodeURI(data[i].url.substring((data[i].url.lastIndexOf("/")+1)))), (err) => {
          if(err) console.log(err);
        });
      }
    }
    msgIDs += "'')";
    console.log(msgIDs);
    let result = await db.deleteMsgs(msgIDs);
    console.log(result);
    if(data.length == result.affectedRows) {
      client.emit("msgs-deleted", data);
      let res2 = await db.getReceiverID(data[0].msgID);
      console.log(res2);
      if(socketData[res2[0].receiverID])
        client.broadcast.to(socketData[res2[0].receiverID]).emit('delete-msgs', data);
    }
  });

  client.on("create-grp", async grpData => {
    let result = await db.createGroup({
      ...grpData,
      ownerID: user.id
    });
    console.log(result);
    client.emit("grp-created", {
      result: result,
      grpData: grpData
    });
    for(let i = 0; i < grpData.ids.length; i++) {
      if(socketData[grpData.ids[i]])
        client.broadcast.to(socketData[grpData.ids[i]]).emit('added-to-grp', {
          id: grpData.grpID,
          name: grpData.grpName,
          membersIDs: grpData.ids.concat([`${user.id}`]),
          ownerID: user.id,
          received: [],
          sent: []
        });
    }
  });

  client.on('add-grp-member',async data => {
    let res1 = await db.getGrpData(data);
    console.log(res1[0].membersIDs.split(";"));
    for(let j = 0; j < data.contacts.length; j++) {
      let res =  await db.findGrpMember({
        id: data.contacts[j],
        grpID: data.grpID
      });
      if(res.length == 1) {
      
      } else {
        let result = await db.addGrpMember({
          id: data.contacts[j],
          grpID: data.grpID
        });
        if(result.affectedRows == 1) {
          client.emit("grp-member-added", {
            grpID: data.grpID,
            contact: data.contacts[j]
          });
          for(let i = 0; i < data.contacts.length; i++ ) {
            if(socketData[`${data.contacts[i]}`])
              client.broadcast.to(socketData[`${data.contacts[i]}`]).emit("added-to-grp", res1);  
          }
        }
      }
    }
  });

  client.on('grp-msg', async msg => {
    console.log(msg);
    for(let i = 0; i < msg.membersIDs.length; i++) {
      let id = msg.membersIDs[i];
      if(socketData[id]) {    // online
        client.broadcast.to(socketData[id]).emit('grp-msg', {
          message: msg.msg,
          messageID: msg.msgID,
          msgType: msg.msgType,
          senderID: user.id,
          senderName: user.name,
          senderMail: user.email,
          grpID: msg.id,
          grpName: msg.name,
          ownerID: msg.ownerID,
          status: msg.status
        });
      }
    }

    let result = await db.saveGroupMsg({
      ...msg,
      senderID: user.id,
      senderName: user.name
    });
  });

  client.on('get-grp-chat', async id => {
    let result = await db.getGroupChat(id);
    client.emit('grp-chat', {
      result: result,
      id: id
    });
  });

  client.on('delete-grp-msgs',async dataObj => {
    console.log(dataObj);
    let data = dataObj.data;
    let msgIDs = "(";
    for(let i = 0; i < data.length; i++) {
      msgIDs += `'${data[i].msgID}',`;
      if(data[i].msgType) { // implies its an attachment
        fs.unlink(path.join(__dirname, "./uploads", decodeURI(data[i].url.substring((data[i].url.lastIndexOf("/")+1)))), (err) => {
          if(err) console.log(err);
        });
      }
    }
    msgIDs += "'')";
    console.log(msgIDs);
    let result = await db.deleteGrpMsgs(msgIDs);
    console.log(result);
    if(data.length == result.affectedRows) {
      client.emit("grp-msgs-deleted", dataObj);
      let res2 = await db.getMembersIDs(dataObj.grpID);
      console.log(res2);
      res2 = res2[0].membersIDs.split(";");
      console.log(res2);
      for(let j = 0; j < res2.length; j++) {
        if(socketData[res2[j]])
          client.broadcast.to(socketData[res2[j]]).emit('delete-grp-msgs', dataObj);
      }
    }
  });

  client.on('logout', () => {
    if(client.handshake.session && client.handshake.session.user)
      delete socketData[client.handshake.session.user.id];
    client.handshake.session.destroy();
    client.emit('session-destroyed');
    // client.disconnect();
  });

  client.on("disconnect", () => {
    // console.log(client.handshake.session.user.name + " disconnected");
    if(client.handshake.session && client.handshake.session.user)
      delete socketData[client.handshake.session.user.id];
    
    console.log('disconnected');
    // socketData[user.id] = null;
    // console.log(io.sockets);
    client.broadcast.emit('user-disconnected', {
      id: user.id
    });
  });

});

server.listen(3000, () => console.log('Chat app listening on port 3000!'));