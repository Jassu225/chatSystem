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

function emitMsg(msgObj) {
  socket.emit('msg', {
    msg: msgObj.msg,
    msgID: msgObj.msgID,
    isFriend: msgObj.isFriend,
    targetUserID: selectedUserID
  });
}

function emitMsgAck(data) {
  socket.emit('msg-ack', data);
}

function getUserChatFromServer(id) {
  socket.emit('get-chat', id);
}

function sendLogout() {
  socket.emit('logout');
}

socket.on("connect", (res) => {
  console.log('conneted');
  socket.emit("store-socket-id");
});

socket.on('session-id-stored', selfData => {
  myData = selfData;
  myData.friendsData = [];
  console.log(myData);
  playSound();
  if(myData.friendsIDs) {
    let ids = myData.friendsIDs.split(";");
      for (let i = 0; i < ids.length; i++) {
        ids[i] = parseInt(ids[i], 10);
      }
    socket.emit('get-friends-list');
    // myData.ids = ids;
  }
});

socket.on('friends-list', friendsData => {
  console.log(friendsData);
  myData.friendsData = friendsData;
  console.log(myData);
  showFriends();
});

socket.on('friend-added', id => {
  addFriend(id);
});

socket.on('chat', result => {
  console.log(result);
  userData[result.id] = {
    sent: result.sent,
    received: result.received
  };
  if(selectedUserID == result.id)
    showChat(userData[result.id]);
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

socket.on('user-offline', id => {
  console.log(id);
  userIsOffline(id);
});

socket.on('msg', data => {
  console.log(data);
  messageReceived(data);
  emitMsgAck(data);
});

socket.on('msg-ack', data => {
  console.log(data);
  messageAcknowledged(data.msgID);
});
// socket.on('msg-status', data => {
//   console.log(data);
//   msgStatus(data);
// });

socket.on('session-destroyed', () => {
  // window.location = "/";
  sayGoodbye();
});

socket.on("user-disconnected", user => {
  userDisconnected(user);
});