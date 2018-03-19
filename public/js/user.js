var searchData = null;
var selectedUserID = null;

function searchNameInDB(keyword) {
  // sendAJAX({keyword: keyword});
  if(keyword)
    sendUserSearchRequest(keyword);
}


function showResults(results) {
  searchData = results;
  let resultDiv = document.getElementsByClassName("search-result")[0];
  let innerHTML = "";
  results.forEach( (result, index) => {
    innerHTML += `<p class="cursor-pointer" onclick="selectUser(${index})">${result.username}</p><br />`;
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

function selectUser(index) {
  selectedUserID = searchData[index].id;
  let selected = document.getElementsByClassName('selected-user')[0];
  selected.innerHTML =  `<span style="font-size: 20px;font-weight:500;color:white;">${searchData[index].username}</span><br />` +
                            `<span style="font-size: 13px; font-weight: light;color:rgba(255,255,255,0.9);">${searchData[index].email}</span>`;
  document.getElementsByClassName("search-result")[0].classList.add("hide");
  document.getElementsByClassName("search-bar")[0].value = "";
  isOnline(searchData[index].id);
}

function userIsOnline(userID) {
  if (userID === selectedUserID)
    document.getElementsByClassName('selected-user')[0].innerHTML += `<span class="online-status online"></span>`;
}

function userIsOffline() {
  // if (userID === selectedUserID)
    document.getElementsByClassName('selected-user')[0].innerHTML += `<span class="online-status offline"></span>`;
}

function broadcastOnline() {
  console.log('focus');
}

function broadcastOffline() {
  console.log('out of blur');
}

function sendMsg() {
  let msg = document.getElementsByClassName('type-msg')[0].value;
  if(msg)
    emitMsg(msg);
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