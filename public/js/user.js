function searchNameInDB(keyword) {
  sendAJAX({keyword: keyword});
}

function sendAJAX(data) {
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4) {
      if (this.status == 200) {
        
      } 
      // else if (this.status == 401) {  // Authentication failure
      //   alert("email or/and password is/are incorrect");
      // }
    }
  };
  xhttp.open("POST", "/search", true);
  xhttp.setRequestHeader("Content-type", "application/json");
  xhttp.send(JSON.stringify(data));
}