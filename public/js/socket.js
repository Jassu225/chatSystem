var serverLocation = "http://localhost:3000";

var socket = io.connect(serverLocation);
var siofu = new SocketIOFileUpload(socket);

var receiverSockID = null;
var isReceiverOnline = false;


siofu.listenOnInput(document.getElementById("siofu_input"));

siofu.addEventListener("progress", function(event){
  var percent = event.bytesLoaded / event.file.size * 100;
  // console.log("File is", percent.toFixed(2), "percent loaded");
  document.getElementById(`${uploadingFiles[event.file.name].msgID}`).childNodes[0].childNodes[0].childNodes[1].childNodes[0].style.width = percent + '%';
});

// Do something when a file is uploaded: 
siofu.addEventListener("complete", function(event){
  console.log(event.success);
  // console.log(event.file);
});

siofu.addEventListener("error", function(event){
  console.log(event.success);
  // console.log(event.file);
});

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
    msgType: msgObj.msgType,
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

function sendDeleteRequest(data) {
  socket.emit('delete-msgs', data);
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

socket.on('file-saved', file => {
  let msgID = uploadingFiles[file.name].msgID;
  let msg = document.getElementById(`${msgID}`).childNodes[0].childNodes[0];
  let el = msg.childNodes[0];
  el.classList.remove("text-decoration-none");
  el.href = file.url;
  msg.removeChild(msg.childNodes[1]);

  userData[uploadingFiles[file.name].receiverID].sent.push({
    msg: msg.innerHTML,
    msgID: msgID,
    status: 0
  });
  let friend = false;
  if(isFriend(uploadingFiles[file.name].receiverID))
    friend = true;
  emitMsg({
    msg: msg.innerHTML,
    msgID: msgID,
    msgType: 1,
    isFriend: friend
  });
});

socket.on('delete-msgs', data => {
  for(let i = 0; i < data.length; i++) {
    let el = document.getElementById(`${data[i].msgID}`);
    el.childNodes[0].innerHTML = '<i class="deleted-msg">This message was deleted</i>';
    el.setAttribute("status", "-1");
  }
});

socket.on("msgs-deleted", data => {
  for(let i = 0; i < data.length; i++) {
    let el = document.getElementById(`${data[i].msgID}`);
    el.childNodes[0].innerHTML = '<i class="deleted-msg">This message was deleted</i>';
    el.setAttribute("status", "-1");
  }
});

socket.on('session-destroyed', () => {
  // window.location = "/";
  sayGoodbye();
});

socket.on("user-disconnected", user => {
  userDisconnected(user);
});