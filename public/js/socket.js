var serverLocation = "http://localhost:3000";

var socket = io.connect(serverLocation);
var receiverSockID = null;
var isReceiverOnline = false;

function  sendUserSearchRequest(keyword) {
  socket.emit("search-user", keyword);
}

function isOnline(id) {
  socket.emit('is-online', id);
}

function emitMsg(msg) {
  socket.emit('msg', {
    msg: msg,
    targetUserID: selectedUserID
  });
}

socket.on("connect", (res) => {
  console.log('conneted');
  socket.emit("store-socket-id");
});

socket.on("connected", user => {
  userConnected(user);
});

socket.on("search-result", result => {
  console.log(result);
  showResults(result);
});

socket.on('user-online', data => {
  receiverSockID = data.socketId;
  isReceiverOnline = true;
  userIsOnline(data.id);
  console.log("user is online");
});

socket.on('user-offline', data => {
  userIsOffline();
});

socket.on('msg', data => {
  console.log(data);
  messageReceived(data);
});

socket.on("user-disconnected", user => {
  userDisconnected(user);
});