"use strict";

$(function () {
  $("#uploadNewButton").hide();
  $("#uploadButton").click(function () {
    sendInputText();
    $("#uploadCompressButton").attr("disabled", true);
    $("#uploadNewButton").show();
  });
});

async function sendInputText() {
  // Fetch the files from the input element
  var pageID = document.getElementById("pID").value;
  var clientID = document.getElementById("cID").value;
  var clientSecret = document.getElementById("cSecret").value;
  var credentials = clientID + "|" + clientSecret;

  var request = new XMLHttpRequest();

  request.onload = function () {
    if (request.status == 200) {
      var response = JSON.parse(request.responseText);
      swal({
        title: "Credentials added successfully!",
        text: response.message,
        icon: "success",
        button: "OK!"
      }).then(function (button) {
        // Add the pages path
        window.location.href = "./index.html";
      });
    }
    request.onerror = function () {
      console.log("** An error occurred during the transaction");
      if (request.status === 400) {
        swal({
          title: "Oops! Something went wrong!",
          text: "Added credentials were faulty.",
          icon: "error",
          button: "OK!"
        }).then(function (button) {
          // Add the pages path
          window.location.href = "./index.html";
        });
      } else {
        swal({
          title: "Oops! Something went wrong!",
          text: "Press OK to continue",
          icon: "error",
          button: "OK!"
        }).then(function (button) {
          // Add the pages path
          window.location.href = "./index.html";
        });
      }
    };
  };

  // TRUE = CERTIFICATES, FALSE = LOCAL
  var sslEnabled = true;
  
  if (sslEnabled) {
    request.open(
    // Cange to your address
    "POST", "https://ADD_ADDRESS.com:3005/credentials/" + pageID + "/" + credentials);
  } else {
    request.open(
    // Localhost address for testing
    "POST", "http://localhost:3005/credentials/" + pageID + "/" + credentials);
  }

  request.send(null);
}