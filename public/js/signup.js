let form = document.getElementsByTagName("form")[0];

function validateAndSubmit() {
  // let error = document.getElementsByClassName("error")[0];

  if (form.checkValidity()) {

    if (!matchPasswords())
      return;

    // All validations are satisfied
    document.getElementById("submit").click();
  } else
    document.getElementById("submit").click();

}

function matchPasswords() {
  let password = document.getElementById("password");
  let rePassword = document.getElementById("re-password");

  rePassword.setCustomValidity("");

  if (password.value != rePassword.value) {
    rePassword.setCustomValidity("Passwords do not match");
    return false;
  }

  return true;
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
  sendAJAX(data);
});

function sendAJAX(data) {
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4) {
      if (this.status == 200) {
        serverResponse(this.responseText);
      }
    }
  };
  xhttp.open("POST", "/signup", true);
  xhttp.setRequestHeader("Content-type", "application/json");
  xhttp.send(JSON.stringify(data));
}

function serverResponse(response) {
  let json = JSON.parse(response);
  // console.log(json);
  if( json.affectedRows == 1) {
    // alert('Your a/c has been successfully created');
    confirm('Your a/c has been successfully created');
    gotoLoginPage();
  }
}

function gotoLoginPage() {
  window.location = "/";
}