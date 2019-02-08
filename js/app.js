/* global OT API_KEY TOKEN SESSION_ID SAMPLE_SERVER_BASE_URL */

var apiKey;
var session;
var sessionId;
var token;
var archiveID;
var resolutionValue;
var subscriberTest;
$(document).ready(function ready() {
  $('#stop').hide();
  archiveID = null;

});

function handleError(error) {
  if (error) {
    console.error(error);
  }
}

function initializeSession() {
   session = OT.initSession(apiKey, sessionId);
   resolution=
  // Subscribe to a newly created stream
  session.on('streamCreated', function streamCreated(event) {
    var subscriberOptions = {
      insertMode: 'append',
      width: '100%',
      height: '100%',
      preferredResolution: { width : 1280,height:720}
    };
    subscriberTest= session.subscribe(event.stream, 'subscriber', subscriberOptions, handleError);
  });
  session.on('archiveStarted', function archiveStarted(event) {
    archiveID = event.id;
    console.log('Archive started ' + archiveID);
    $('#stop').show();
    $('#start').hide();
  });

  session.on('archiveStopped', function archiveStopped(event) {
    archiveID = event.id;
    console.log('Archive stopped ' + archiveID);
    $('#start').hide();
    $('#stop').hide();
    $('#view').show();
  });
  session.on('sessionDisconnected', function sessionDisconnected(event) {
    console.log('You were disconnected from the session.', event.reason);
  });

  // initialize the publisher
  
  var publisherOptions = {
    insertMode: 'append',
    width: '100%',
    height: '100%',
  };
  var publisher = OT.initPublisher('publisher', publisherOptions, handleError);

  // Connect to the session
  session.connect(token, function callback(error) {
    if (error) {
      handleError(error);
    } else {
      // If the connection is successful, publish the publisher to the session
      session.publish(publisher, handleError);
    }
  });


//signalling
// Receive a message and append it to the history
var msgHistory = document.querySelector('#history');
session.on('signal:msg', function signalCallback(event) {
    var msg = document.createElement('p');
    msg.textContent = event.data;
    msg.className = event.from.connectionId === session.connection.connectionId ? 'mine' : 'theirs';
    msgHistory.appendChild(msg);
    msg.scrollIntoView();
  });
}




// Text chat
var form = document.querySelector('form');
var msgTxt = document.querySelector('#msgTxt');

// Send a signal once the user enters data in the form
form.addEventListener('submit', function submit(event) {
  event.preventDefault();

  session.signal({
    type: 'msg',
    data: msgTxt.value
  }, function signalCallback(error) {
    if (error) {
      console.error('Error sending signal:', error.name, error.message);
    } else {
      msgTxt.value = '';
    }
  });
});


// See the config.js file.
if (API_KEY && TOKEN && SESSION_ID) {
  apiKey = API_KEY;
  sessionId = SESSION_ID;
  token = TOKEN;
  initializeSession();
} else if (SAMPLE_SERVER_BASE_URL) {
  // Make an Ajax request to get the OpenTok API key, session ID, and token from the server
  fetch(SAMPLE_SERVER_BASE_URL + '/session').then(function fetch(res) {
    return res.json();
  }).then(function fetchJson(json) {
    apiKey = json.apiKey;
    sessionId = json.sessionId;
    token = json.token;

    initializeSession();
  }).catch(function catchErr(error) {
    handleError(error);
    alert('Failed to get opentok sessionId and token. Make sure you have updated the config.js file.');
  });
}

// Start recording
function startArchive() { // eslint-disable-line no-unused-vars
  $.ajax({
    url: SAMPLE_SERVER_BASE_URL + '/archive/start',
    type: 'POST',
    contentType: 'application/json', // send as JSON
    data: JSON.stringify({'sessionId': sessionId}),

    complete: function complete() {
      // called when complete
      console.log('startArchive() complete');
    },

    success: function success() {
      // called when successful
      console.log('successfully called startArchive()');
    },

    error: function error() {
      // called when there is an error
      console.log('error calling startArchive()');
    }
  });

  $('#start').hide();
  $('#stop').show();
}

// Stop recording
function stopArchive() { // eslint-disable-line no-unused-vars
  $.post(SAMPLE_SERVER_BASE_URL + '/archive/' + archiveID + '/stop');
  $('#stop').hide();
  $('#view').prop('disabled', false);
  $('#stop').show();
  $('#modifyresolution').show();
} 

function captureScreen() {

 var imgData = subscriberTest.getImgData();
 var img = document.createElement("img");
 img.setAttribute("src", "data:image/png;base64," + imgData);
 var imgWin = window.open("about:blank","Screenshot");
 imgWin.document.write("<body></body>");
 imgWin.document.body.appendChild(img);


}
function modifyResolution()
{
  
  var e = document.getElementById("modifyresolution");
  resolutionValue = e.options[e.selectedIndex].value;
  var resolutionObj= {width:1280 , height: 720}
  if(resolutionValue == 1)
  {
    resolutionObj.width=1280;
    resolutionObj.height=720;
  }
  else if(resolutionValue==2)
  {
    resolutionObj.width=640;
    resolutionObj.height=480;
  }
  else
  {
    resolutionObj.width=320;
    resolutionObj.height=240;
  }
  console.log(resolutionObj);
  subscriberTest.setPreferredResolution(resolutionObj);

}

// Get the archive status. If it is  "available", download it. Otherwise, keep checking
// every 5 secs until it is "available"
function viewArchive() { // eslint-disable-line no-unused-vars
  $('#view').prop('disabled', true);
  window.location = SAMPLE_SERVER_BASE_URL + /archive/ + archiveID + '/view';
}

$('#start').show();
$('#view').hide(); 

