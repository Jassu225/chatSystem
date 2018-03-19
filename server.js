const express  = require('express');
const app = express();

const path = require('path');
const bodyParser = require('body-parser');  // for parsing data sent in a post request
// const redisStore = require('connect-redis')(session); // for accessing session data in socket
const server = require('http').createServer(app);
const io = require('socket.io', { rememberTransport: false, transports: ['WebSocket', 'Flash Socket', 'AJAX long-polling'] })(server);
const session = require('express-session')({
    // store: new redisStore({}),
    secret: '41a6a4e1b30d55c3295bbc36230a5742', // md5 hash of 'chat_system'
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}); // for session management in node.js
const sharedsession = require("express-socket.io-session");
const md5 = require('md5');

const appRootDir = __dirname;
const srcDir = path.join(__dirname, "./src/");
const publicDir = path.join(__dirname, "./public/");

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

app.use("/public", express.static(publicDir));

io.use(sharedsession(session, {
  autoSave:true
}));

app.get("/", (req, res) => {
  // console.log(req.session);
  // req.session.destroy();
  if(req.session.user) {
    res.sendFile(path.join(srcDir, "./html/user.html"));
  } else {
    res.sendFile(path.join(srcDir, "./html/login.html"));
  }
});

app.get("/signupPage", (req, res) => {
  res.sendFile(path.join(srcDir, "./html", "./signup.html"));
  db.checkUserTable();
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
      name: result[0].username
    };
    res.sendFile(path.join(srcDir, "./html", "./user.html"));
  } else {
    res.sendStatus(401);
  }
});

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
  let user = client.handshake.session.user;
  console.log('connected');
  client.on("store-socket-id", (data) => {
    if(user)
      socketData[user.id] = client.id;
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
      client.emit('user-offline');
    }
  });

  client.on('msg', data => {
    let msg = data.msg;
    let id = data.targetUserID;

    if(socketData[id])
      client.broadcast.to(socketData[id]).emit('msg', msg);
  });

  client.on("disconnect", () => {
    // console.log(client.handshake.session.user.name + " disconnected");
    if(client.handshake.session && client.handshake.session.user)
      delete socketData[client.handshake.session.user.id];
  });

});

server.listen(3000, () => console.log('Chat app listening on port 3000!'));

