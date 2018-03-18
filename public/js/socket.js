var serverLocation = "http://localhost:3000";

var socket = io.connect(serverLocation);

function  sendUserSearchRequest(keyword) {
  socket.emit("search-user", keyword);
}

socket.on("search-result", result => {
  console.log(result);
  showResults(result);
});