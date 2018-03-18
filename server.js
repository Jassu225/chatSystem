const express  = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const path = require('path');
const bodyParser = require('body-parser');  // for parsing data sent in a post request
const session = require('express-session');
const md5 = require('md5');

const appRootDir = __dirname;
const srcDir = path.join(__dirname, "./src/");
const publicDir = path.join(__dirname, "./public/");

const db = require("./db");

db.connect();

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.use("/public", express.static(publicDir));
app.use(session({
  secret: '41a6a4e1b30d55c3295bbc36230a5742', // md5 hash of 'chat_system'
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.get("/", (req, res) => {
  console.log(req.session);
  if(req.session.email) {
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
    console.log(result);
    res.sendStatus(401);
    return;
    res.sendFile(path.join(srcDir, "./html", "./user.html"));
    req.session.email = email;
    req.session.username = result[0].username;
  } else {
    res.sendStatus(401);
  }
});

app.post("/search", async (req, res) => {
  const keyword = req.body.keyword;
  console.log(keyword);

  let result = await db.searchUser(keyword);
});

// IO (socket) connection handler

io.on("connection", (client) => {
  client.on("disconnect", () => {

  });

});

server.listen(3000, () => console.log('Chat app listening on port 3000!'));

