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
  if(selectedUserID)
    socket.emit('delete-msgs', data);
  else if(selectedGroupID) {
    socket.emit('delete-grp-msgs', {
      data: data,
      grpID: selectedGroupID,
      senderID: myData.id,
      senderName: myData.name
    });
  }
}

function groupCreateReq(grpData) {
  socket.emit("create-grp", grpData);
}

function emitGroupMsg(msg) {
  socket.emit('grp-msg', msg);
}

function getGroupChatFromServer(id) {
  socket.emit('get-grp-chat', id);
}

function addGrpMember(data) {
  socket.emit('add-grp-member', data);
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
  myData.groupsData = [];
  console.log(myData);
  playSound();
  if(myData.friendsIDs) {
    let ids = myData.friendsIDs.split(";");
      for (let i = 0; i < ids.length; i++) {
        ids[i] = parseInt(ids[i], 10);
      }
    socket.emit('get-friends-list');
    socket.emit('get-groups-list');
    // myData.ids = ids;
  }
});

socket.on('friends-list', friendsData => {
  console.log(friendsData);
  myData.friendsData = friendsData;
  console.log(myData);
  showFriends();
});

socket.on('groups-info', data => {
  console.log(data);
  myData.groupsData = data;
  showGroups();
});

socket.on("grp-member-added", data => {
  console.log(data);
  grpMemberAdded(data);
});

socket.on('grp-msg', msg => {
  console.log(msg);
  groupMsgReceived(msg);
});

socket.on('grp-chat', grp => {
  console.log(grp);
  splitGrpMsgs(grp);
});

socket.on('delete-grp-msgs', data => {
  console.log(data);
  deleteGrpMsgs(data);
});

socket.on("grp-msgs-deleted", data => {
  console.log(data);
  grpMsgsDeleted(data);
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

socket.on("grp-created", data => {
  console.log(data);
  groupCreated(data);
});

socket.on('added-to-grp', data => {
  console.log(data);
  groupData[data.id] = {
    ...data
  };
  addedToGroup(data);
});

socket.on('file-saved', file => {
  let msgID = uploadingFiles[file.name].msgID;
  let msg = document.getElementById(`${msgID}`).childNodes[0].childNodes[0];
  let el = msg.childNodes[0];
  el.classList.remove("text-decoration-none");
  el.href = file.url;
  msg.removeChild(msg.childNodes[1]);

  if(selectedUserID) {
    userData[uploadingFiles[file.name].receiverID].sent.push({
      msg: msg.innerHTML,
      msgID: msgID,
      msgType: 1,
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
  } else if(selectedGroupID) {
    groupData[selectedGroupID].sent.push({
      msg: msg.innerHTML,
      msgID: msgID,
      msgType: 1,
      status: -2
    });

    emitGroupMsg({
      ...groupData[selectedGroupID],
      msg: msg.innerHTML,
      msgID: msgID,
      msgType: 1,
      status: -2
    });
  }
});

socket.on('delete-msgs', data => {
  for(let i = 0; i < data.length; i++) {
    let el = document.getElementById(`${data[i].msgID}`);
    el.childNodes[0].innerHTML = `<div><div class="deleted-msg">This message was deleted</div><div class="time">${ getFormattedDate(data[i].msgID)}</div></div>`;
    el.setAttribute("status", "-1");
  }
});

socket.on("msgs-deleted", data => {
  for(let i = 0; i < data.length; i++) {
    let el = document.getElementById(`${data[i].msgID}`);
    el.childNodes[0].innerHTML = `<div><div class="deleted-msg">This message was deleted</div><div class="time">${ getFormattedDate(data[i].msgID)}</div></div>`;
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