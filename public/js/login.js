let form = document.getElementsByTagName("form")[0];

function gotoSignUpPage() {
  window.location = "/signupPage";
}

function gotoForgotPasswordPage() {
  window.location = "/forgotPassword";
}

function submit() {
  document.getElementById("submit").click();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  let formData = new FormData(form);
  let data = {};
  for (let key of formData.keys()) {
    // console.log(key);
    data[key] = formData.get(key);
  }
  // console.log(data);
  data["password"] = hex_md5(hex_md5(hex_md5(data["password"])));
  sendAJAX(data);
});

function sendAJAX(data) {
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4) {
      if (this.status == 200) {
        document.open();
        document.write(this.responseText);
        document.close();
      } else if (this.status == 401) {  // Authentication failure
        alert("email or/and password is/are incorrect");
      }
    }
  };
  xhttp.open("POST", "/login", true);
  xhttp.setRequestHeader("Content-type", "application/json");
  xhttp.send(JSON.stringify(data));
}

let audio = null;
function createAudio() {
  audio = new Audio("/public/audio/21-naruto-main-theme.mp3");

}

createAudio();
// audio.play();
