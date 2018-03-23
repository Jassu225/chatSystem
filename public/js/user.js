var searchData = {};
var selectedUserID = null;
var myData = null;

function showFriends() {
  let element = document.getElementsByClassName("contact-list")[0];
  let innerHTML = "";

  for(let i = 0; i < myData.friendsData.length; i++) {
    innerHTML += `<div class="contact cursor-pointer" onclick="selectUser(${myData.friendsData[i].id})">${myData.friendsData[i].username}</div>`;
    searchData[myData.friendsData[i].id] = {
      email: myData.friendsData[i].email,
      username: myData.friendsData[i].username
    };
  }
  element.innerHTML = innerHTML;
}

function appendFriends(friend) {
  document.getElementsByClassName("contact-list")[0].innerHTML += `<div class="contact" onclick="selectUser(${friend.id})">${friend.username}</div>`;
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
                            `<span style="font-size: 13px; font-weight: light;color:rgba(255,255,255,0.9);">${searchData[id].email}</span>`;
  document.getElementsByClassName("search-result")[0].classList.add("hide");
  document.getElementsByClassName("search-bar")[0].value = "";
  isOnline(id);
}

function userIsOnline(userID) {
  if (userID === selectedUserID)
    document.getElementsByClassName('selected-user')[0].innerHTML += `<span class="online-status online"></span>`;
}

function userIsOffline() {
  // if (userID === selectedUserID)
    document.getElementsByClassName('selected-user')[0].innerHTML += `<span class="online-status offline"></span>`;
}

function broadcastTyping() {

}

function broadcastNotTyping() {

}

function enterSend(event) {

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

function sendMsg() {
  let msg = document.getElementsByClassName('type-msg')[0].value.replace("\n", "<br />");
  let msgID = new Date().getTime().toString();
  if(msg && selectedUserID) {
    document.getElementsByClassName('type-msg')[0].value = "";
    document.getElementsByClassName('msg-container')[0].innerHTML += `<div id="${msgID}" class="msg self"><span>${msg}</span></div>`;
    let friend = false;
    if(isFriend(selectedUserID))
      friend = true;
    emitMsg({
      msg: msg,
      msgID: msgID,
      isFriend: friend
    });
  }
}

function messageAcknowledged(msgID) {
  console.log(msgID);
  document.getElementById(msgID).childNodes[0].innerHTML += " <span style='color: #7b39e4;'>&#10004;</span>";
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
  }
  if (selectedUserID == msgObj.senderID) {
    document.getElementsByClassName('msg-container')[0].innerHTML += `<div id="${msgObj.messageID}" class="msg received"><span>${msgObj.message}</span></div>`;
  }
}

function userDisconnected(user) {
  console.log('disconnected user');
  if(user.id == selectedUserID) {
    let element = document.getElementsByClassName('online-status')[0];
    element.classList.remove('online');
    element.classList.add('offline');
  }
}

function msgStatus(data) {
  switch(data.msgStatusCode) {
    case 0: // needs push i.e. not received by target

      break;
    case 1: // pushed i.e. received by target
      break;
  }
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