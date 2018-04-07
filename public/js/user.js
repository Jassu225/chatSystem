var searchData = {};
var selectedUserID = null;
var userData = {};
var myData = null;
var selectedMsgCount = 0;
var uploadingFiles = {};

function showFriends() {
  let element = document.getElementsByClassName("contact-list")[0];
  let innerHTML = "";

  for(let i = 0; i < myData.friendsData.length; i++) {
    innerHTML += `<div id="contact-id-${myData.friendsData[i].id}" oncontextmenu="javascript:alert('success!');return false;" class="contact cursor-pointer" onclick="selectUser(${myData.friendsData[i].id})">${myData.friendsData[i].username} <span class="online-status offline"></span></div>`;
    searchData[myData.friendsData[i].id] = {
      email: myData.friendsData[i].email,
      username: myData.friendsData[i].username
    };
    isOnline(myData.friendsData[i].id);
  }
  element.innerHTML = innerHTML;
}

function appendFriends(friend) {
  document.getElementsByClassName("contact-list")[0].innerHTML += `<div id="contact-id-${friend.id}" class="contact cursor-pointer" onclick="selectUser(${friend.id})">${friend.username} <span class="online-status offline"></span></div>`;
  isOnline(friend.id);
}

function showChat(chat) {
  let innerHTML = "";
  let i = j = 0;
  try {
    while( (i < chat.sent.length) || (j < chat.received.length)) {
      if(chat.sent[i].msgID < chat.received[j].msgID) {
        innerHTML += `<div id="${chat.sent[i].msgID}" type="${chat.sent[i].msgType}" status="${chat.sent[i].status}" class="msg self"><div ondblclick="selectMsg(this)"><div>${chat.sent[i].msg}${(chat.sent[i].status == 1)? " <span style='color: #7b39e4;float:right;'>&#10004;</span>": ""}</div><div class="time">${getFormattedDate(chat.sent[i].msgID)}</div></div></div>`;
        i++;
      } else {
        innerHTML += `<div id="${chat.received[j].msgID}" type="${chat.received[j].msgType}" status="1" class="msg received"><div><div>${chat.received[j].msg}</div><div class="time">${getFormattedDate(chat.received[j].msgID)}</div></div></div>`;
        j++;
        if(chat.received[j].status == 0) {
          emitMsgAck({
            messageID: chat.received[j].msgID,
            senderID: selectedUserID,
            updateDB: true
          });
          chat.received[j].status = 1;
        }
      }
    }
  } catch(err) {
    if ( i >= chat.sent.length) {
      for(; j < chat.received.length; j++) {
        innerHTML += `<div id="${chat.received[j].msgID}" type="${chat.received[j].msgType}" status="1" class="msg received"><div><div>${chat.received[j].msg}</div><div class="time">${getFormattedDate(chat.received[j].msgID)}</div></div></div>`;
        if(chat.received[j].status == 0) {
          emitMsgAck({
            messageID: chat.received[j].msgID,
            senderID: selectedUserID,
            updateDB: true
          });
          chat.received[j].status = 1;
        }
      }
    } else if (j >= chat.received.length) {
      for(; i < chat.sent.length; i++) {
        innerHTML += `<div id="${chat.sent[i].msgID}" type="${chat.sent[i].msgType}" status="${chat.sent[i].status}" class="msg self"><div ondblclick="selectMsg(this)"><div>${chat.sent[i].msg}${(chat.sent[i].status == 1)? " <span style='color: #7b39e4;float:right;'>&#10004;</span>": ""}</div><div class="time">${getFormattedDate(chat.sent[i].msgID)}</div></div></div>`;
      }
    } else {
      console.error(err);
    }
  }
  if(chat.sent.length == 0) {
    userData[selectedUserID].sent = [];
  }
  if(chat.received.length == 0) {
    userData[selectedUserID].received = [];
  }
  document.getElementsByClassName('msg-container')[0].innerHTML = innerHTML;
  // console.log(chat);
  scrollToBottom();
}

function searchNameInDB(keyword) {
  // sendAJAX({keyword: keyword});
  if(keyword)
    sendUserSearchRequest(keyword);
}

function addSearchData(results) {
  for(let i = 0; i < results.length; i++) {
    if(!searchData[results[i].id])
      searchData[results[i].id] = {
        email: results[i].email,
        username: results[i].username
      };
  }
}

function showResults(results) {
  addSearchData(results);
  let resultDiv = document.getElementsByClassName("search-result")[0];
  let innerHTML = "";
  results.forEach( (result, index) => {
    innerHTML += `<p class="cursor-pointer full-width" onclick="selectUser(${result.id})">${result.username}</p><br />`;
  });
  if(innerHTML)
    resultDiv.innerHTML = innerHTML;
  else
    resultDiv.innerHTML = `<p>No results found</p>`;
  resultDiv.classList.remove("hide");
}

function checkKey(event) {
  var x = event.which | event.keyCode;
  if (x == 27) {  // 'Esc' key
    document.getElementsByClassName("search-result")[0].classList.add("hide");
  }
}

function selectUser(id) {
  selectedUserID = id;
  let selected = document.getElementsByClassName('selected-user')[0];
  selected.innerHTML =  `<span style="font-size: 20px;font-weight:500;color:white;">${searchData[id].username}</span><br />` +
                            `<span style="font-size: 13px;color:rgba(255,255,255); margin-top: -3px;">${searchData[id].email}</span>` + 
                            `<span class="online-status offline"></span>`;
  document.getElementsByClassName("search-result")[0].classList.add("hide");
  document.getElementsByClassName("search-bar")[0].value = "";
  isOnline(id);
  getUserChat(id);
}

function getUserChat(id) {
  if(userData.id) { // already fetched
    showChat(userData.id);
  } else {
    getUserChatFromServer(id);
  }
}

function userIsOnline(userID) {
  if (userID === selectedUserID) {
    let el = document.getElementsByClassName('selected-user')[0].childNodes[3];
    console.log(el);
    el.classList.remove("offline");
    el.classList.add("online");
  }
  
  let element = document.getElementById(`contact-id-${userID}`).childNodes[1];
  element.classList.remove("offline");
  element.classList.add("online");
}

function userIsOffline(userID) {
  if (userID === selectedUserID) {
    let el = document.getElementsByClassName('selected-user')[0].childNodes[3];
    el.classList.remove("online");
    el.classList.add("offline");
  }
  
  let element = document.getElementById(`contact-id-${userID}`).childNodes[1];

  element.classList.remove("online");
  element.classList.add("offline");
}

function broadcastTyping() {

}

function broadcastNotTyping() {

}

function enterSend(e) {
  var evtobj = window.event? event : e;
  // var x = e.which | e.keyCode;
  //test1 if (evtobj.ctrlKey) alert("Ctrl");
  //test2 if (evtobj.keyCode == 122) alert("z");
  //test 1 & 2
  // if (evtobj.keyCode == 13 && evtobj.ctrlKey) sendMsg();
  if (evtobj.keyCode == 13) sendMsg();
}

// function enterSend(event) {
//   let key = event.which || event.keyCode;
//   if (key)
// }

function userConnected(user) {
  if(user.id == selectedUserID) {
    let element = document.getElementsByClassName('online-status')[0];
    element.classList.remove('offline');
    element.classList.add('online');
  }

  let element = document.getElementById(`contact-id-${user.id}`).childNodes[1];
  element.classList.remove("offline");
  element.classList.add("online");
}

function isFriend(id) {
  if(myData.friendsData) {
    for(let i = 0; i < myData.friendsData.length; i++) {
      let friend = myData.friendsData[i];
      console.log(friend.id);
      console.log(selectedUserID);
      if( friend.id == selectedUserID){
        console.log(friend.id)
        return true;
      }
    }
  }
  // addFriend()
  return false;
}

function addFriend(friendID) {
  myData.friendsData.push({
    id: friendID,
    email: searchData[friendID].email,
    username: searchData[friendID].username
  });
  appendFriends({
    id: friendID,
    email: searchData[friendID].email,
    username: searchData[friendID].username
  });
  console.log(myData);
}

var day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
var month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getFormattedDate(time) {
  let date = new Date(parseInt(time));
  return `${day[date.getDay()]} ${month[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
}

function sendMsg() {
  let msg = document.getElementsByClassName('type-msg')[0].value.replace("\n", "<br />");
  let msgID = new Date().getTime().toString();
  if(msg && selectedUserID) {
    document.getElementsByClassName('type-msg')[0].value = "";
    document.getElementsByClassName('msg-container')[0].innerHTML += `<div id="${msgID}" type="0" status="0" class="msg self"><div ondblclick="selectMsg(this)"><div>${msg}</div><div class="time">${getFormattedDate(msgID)}</div></div></div>`;
    userData[selectedUserID].sent.push({
      msg: msg,
      msgID: msgID,
      msgType: 0,
      status: 0
    });
    let friend = false;
    if(isFriend(selectedUserID))
      friend = true;
    emitMsg({
      msg: msg,
      msgID: msgID,
      msgType: 0,
      isFriend: friend
    });
  }
  scrollToBottom();
}

function selectMsg(child) {
  let element = child.parentElement;
  if(element.getAttribute("status") == -1) return;

  console.log(element.getAttribute("type"));
  if(element.classList.contains("selected")) {  //deselect msg
    element.classList.remove("selected");
    if ( !(--selectedMsgCount) )
      hideDeleteIcon();
  } else {
    element.classList.add("selected");
    if ( !(selectedMsgCount++) )
      showDeleteIcon();
  }
}

function showDeleteIcon() {
  document.getElementsByClassName("del-icon")[0].classList.remove("hide");
}

function hideDeleteIcon() {
  document.getElementsByClassName("del-icon")[0].classList.add("hide");
}

function deleteSelectedMessages() {
  let elements = document.querySelectorAll(".msg.self.selected");
  let data = [];
  for(let i = 0; i < elements.length; i++) {
    let msgType = parseInt(elements[i].getAttribute("type"));
    if(msgType) { //attachment
      data.push({
        msgID: elements[i].id,
        msgType: msgType,
        url: elements[i].childNodes[0].childNodes[0].href
      });
    } else { // text msg
      data.push({
        msgID: elements[i].id,
        msgType: msgType
      });
    }
  }
  sendDeleteRequest(data);
  elements.forEach(element => {
    element.classList.remove("selected");
  });
}

function scrollToBottom() {
  let  element = document.getElementsByClassName('msgs')[0];
  element.scrollTo(0, element.scrollHeight);
}

function messageAcknowledged(msgID) {
  console.log(msgID);
  if(userData[selectedUserID].sent[ userData[selectedUserID].sent.length - 1 ].msgID == msgID)
    userData[selectedUserID].sent[ userData[selectedUserID].sent.length - 1 ].status = 1;
  let el = document.getElementById(msgID);

  // let element = document.createElement("span"); // <span style='color: #7b39e4;'>&#10004;</span>"
  // element.style.color = "#7b39e4";
  // element.style.cssFloat = "right";
  // element.innerHTML = "&#10004;";

  el.childNodes[0].childNodes[0].innerHTML += "<span style='color: #7b39e4;float:right;'>&#10004;</span>";
  el.setAttribute("status", "1");
}

function messageReceived(msgObj) {
  console.log('selected user id : ' + selectedUserID);
  console.log('sender id : ' + msgObj.senderID);
  if(!msgObj.isFriend) {
    myData.friendsData.push({
      id: msgObj.senderID,
      username: msgObj.senderName,
      email: msgObj.senderMail
    });
    appendFriends({
      id: msgObj.senderID,
      username: msgObj.senderName,
      email: msgObj.senderMail 
    });
    addSearchData([{
      id: msgObj.senderID,
      username: msgObj.senderName,
      email: msgObj.senderMail 
    }]);
    userData[msgObj.senderID] = {
      sent: [],
      received: []
    };
  }
  userData[msgObj.senderID].received.push({
    msg: msgObj.message,
    msgID: msgObj.messageID,
    msgType: msgObj.msgType,
    status: 1
  });
  
  if (selectedUserID == msgObj.senderID) {
    document.getElementsByClassName('msg-container')[0].innerHTML += `<div id="${msgObj.messageID}" type="${msgObj.msgType}" status="1" class="msg received"><div><div>${msgObj.message}</div><div class="time">${getFormattedDate(msgObj.messageID)}</div></div></div>`;
  }

  scrollToBottom();
}

function userDisconnected(user) {
  console.log('disconnected user');
  if(user.id == selectedUserID) {
    let element = document.getElementsByClassName('online-status')[0];
    element.classList.remove('online');
    element.classList.add('offline');
  }

  let element = document.getElementById(`contact-id-${user.id}`).childNodes[1];

  element.classList.remove("online");
  element.classList.add("offline");
}

function msgStatus(data) {
  switch(data.msgStatusCode) {
    case 0: // needs push i.e. not received by target

      break;
    case 1: // pushed i.e. received by target
      break;
  }
}

function openFileUploadDialog() {
  if(selectedUserID)
    document.getElementsByClassName("file-uploader")[0].click();
}

function fileUploadMsg(el) {
  let files = el.files;

  // console.log(files);

  if(!files || files.length == 0) return;

  let msgContainer = document.getElementsByClassName('msg-container')[0];
  let innerHTML = "";
  if(selectedUserID) {
    let msgId = new Date().getTime();
    for(let i = 0; i < files.length; i++) {
      let msgID = (msgId + i).toString();
      let msg = `<a class="file-link text-decoration-none" target="_blank">${files[i].name} &nbsp; ${getReadableFileSizeString(files[i].size)}</a>`+
                `<div class="progressbar"><div class="progress"></div></div>`;
      
      uploadingFiles[files[i].name] = {
        msgID: msgID,
        receiverID: selectedUserID
      };
      innerHTML += `<div id="${msgID}" type="1" class="msg self"><div ondblclick="selectMsg(this)"><div>${msg}</div><div class="time">${getFormattedDate(msgID)}</div></div></div>`;
      // userData[selectedUserID].sent.push({
      //   msg: msg,
      //   msgID: msgID,
      //   status: 0
      // });
      // let friend = false;
      // if(isFriend(selectedUserID))
      //   friend = true;
      // emitMsg({
      //   msg: msg,
      //   msgID: msgID,
      //   isFriend: friend
      // });
    }
    msgContainer.innerHTML += innerHTML;
  }
  scrollToBottom();
}

function getReadableFileSizeString(fileSizeInBytes) {
  var i = -1;
  var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
  do {
      fileSizeInBytes = fileSizeInBytes / 1024;
      i++;
  } while (fileSizeInBytes > 1024);

  return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
};

function logout() {
  sendLogout();
}

function playSound() {
  let audio = new Audio();
  if(myData.sessionResumed) {
    audio.src = "/public/audio/WelcomeBack.mp3";
  }
  else {
    audio.src = "/public/audio/Welcome_female.mp3";
    audio.volume = 0.26;
  }

  audio.load();
  audio.play();
}

function sayGoodbye() {
  let audio = new Audio("/public/audio/Goodbye.mp3");
  audio.addEventListener("ended", () => {
    window.location = "/";
  });
  audio.load();
  audio.play();
}
// function sendAJAX(data) {
//   let xhttp = new XMLHttpRequest();
//   xhttp.onreadystatechange = function () {
//     if (this.readyState == 4) {
//       if (this.status == 200) {
        
//       } 
//       else if (this.status == 403) {  // Authentication failure
//         alert("session corrupted");
//       }
//     }
//   };
//   xhttp.open("POST", "/search", true);
//   xhttp.setRequestHeader("Content-type", "application/json");
//   xhttp.send(JSON.stringify(data));
// }