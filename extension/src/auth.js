//AUTH.js
//Check user logged in
chrome.runtime.sendMessage({ command: "checkAuth" }, (response) => {
  document.querySelector(".loading").style.display = "none";
  if (chrome.runtime.lastError) {
    // Something went wrong
    console.warn("Whoops.. " + chrome.runtime.lastError.message);
  }
  console.log(response);
  if (response && response.status == "success") {
    document.querySelector(".loggedInArea").style.display = "block";
    document.querySelector(".loggedInArea span").innerHTML =
      response?.message?.id || response?.message?.email || "User";
  } else {
    document.querySelector(".loginArea").style.display = "block";
  }
});

// Login button event listener
document
  .querySelector(".login-btn-auth")
  .addEventListener("click", function () {
    document.querySelector(".loading").style.display = "block";
    loginFunc();
  });

// Signup button event listener
document
  .querySelector(".signup-btn-auth")
  .addEventListener("click", function () {
    document.querySelector(".loading").style.display = "block";
    signupFunc();
  });

// Google login button event listener (add this to your HTML)
document
  .querySelector(".google-login-btn")
  ?.addEventListener("click", function () {
    document.querySelector(".loading").style.display = "block";
    googleLoginFunc();
  });

// Logout button event listener
document
  .querySelector(".logout-btn-auth")
  .addEventListener("click", function () {
    document.querySelector(".loading").style.display = "block";
    logoutFunc();
  });

var signupFunc = function () {
  //Get login details from form...
  var e = document.querySelector(
    '.loginArea .signup-box input[type="email"]'
  ).value;
  var p = document.querySelector(
    '.loginArea .signup-box input[type="password"]'
  ).value;
  
  if (!e || !p) {
    document.querySelector(".loading").style.display = "none";
    alert("Please enter email and password");
    return;
  }
  
  chrome.runtime.sendMessage(
    { command: "signupUser", data: { e: e, p: p } },
    (response) => {
      document.querySelector(".loading").style.display = "none";
      if (chrome.runtime.lastError) {
        // Something went wrong
        console.warn("Whoops.. " + chrome.runtime.lastError.message);
      }
      console.log(response);
      document.querySelector(".loginArea").style.display = "none";
      document.querySelector(".loggedInArea").style.display = "none";
      if (response.status == "success") {
        document.querySelector(".loggedInArea").style.display = "block";
        document.querySelector(".loggedInArea span").innerHTML =
          response?.message?.id || response?.message?.email || "User";
      } else {
        //add Errors
        if (response.error) {
          alert("Signup failed: " + response.error.message);
        }
        document.querySelector(".loginArea").style.display = "block";
      }
    }
  );
};

var loginFunc = function () {
  //Get login details from form...
  var e = document.querySelector(
    '.loginArea .login-box input[type="email"]'
  ).value;
  var p = document.querySelector(
    '.loginArea .login-box input[type="password"]'
  ).value;
  
  if (!e || !p) {
    document.querySelector(".loading").style.display = "none";
    alert("Please enter email and password");
    return;
  }
  
  chrome.runtime.sendMessage(
    { command: "loginUser", data: { e: e, p: p } },
    (response) => {
      document.querySelector(".loading").style.display = "none";
      if (chrome.runtime.lastError) {
        // Something went wrong
        console.warn("Whoops.. " + chrome.runtime.lastError.message);
      }
      console.log(response);
      document.querySelector(".loginArea").style.display = "none";
      document.querySelector(".loggedInArea").style.display = "none";
      if (response.status == "success") {
        document.querySelector(".loggedInArea").style.display = "block";
        document.querySelector(".loggedInArea span").innerHTML =
          response?.message?.id || response?.message?.email || "User";
      } else {
        //add Errors
        if (response.error) {
          alert("Login failed: " + response.error.message);
        }
        document.querySelector(".loginArea").style.display = "block";
      }
    }
  );
};

// New Google login function
var googleLoginFunc = function () {
  chrome.runtime.sendMessage({ command: "googleLogin" }, (response) => {
    document.querySelector(".loading").style.display = "none";
    if (chrome.runtime.lastError) {
      // Something went wrong
      console.warn("Whoops.. " + chrome.runtime.lastError.message);
    }
    console.log(response);
    document.querySelector(".loginArea").style.display = "none";
    document.querySelector(".loggedInArea").style.display = "none";
    if (response && response.status == "success") {
      document.querySelector(".loggedInArea").style.display = "block";
      document.querySelector(".loggedInArea span").innerHTML =
        response?.message?.id || response?.message?.email || "User";
    } else {
      //add Errors
      if (response?.error) {
        alert("Google login failed: " + response.error.message);
      } else {
        alert("Google login failed");
      }
      document.querySelector(".loginArea").style.display = "block";
    }
  });
};

var logoutFunc = function () {
  document.querySelector(".loggedInArea").style.display = "none";
  document.querySelector(".loginArea").style.display = "block";
  chrome.runtime.sendMessage({ command: "logoutAuth" }, (response) => {
    document.querySelector(".loading").style.display = "none";
    if (chrome.runtime.lastError) {
      // Something went wrong
      console.warn("Whoops.. " + chrome.runtime.lastError.message);
    }
    //logout..
    console.log(response);
  });
};