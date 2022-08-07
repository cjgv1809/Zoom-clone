const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const input = document.getElementById("chat-message");
const ul = document.querySelector(".main__messages");
const myVideo = document.createElement("video");
myVideo.muted = true;

const peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "443",
});

const peers = {};

let myVideoStream;

navigator.mediaDevices
  .getUserMedia({ video: true, audio: true })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    peer.on("call", (call) => {
      call.answer(stream);
      console.log("working");
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        console.log("succesfully answer");
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userId) => {
      setTimeout(() => {
        connectToNewUser(userId, stream);
      }, 1000);
    });

    socket.on("user-disconnected", (userId) => {
      if (peers[userId]) {
        peers[userId].close();
      }
    });

    // Getting input value
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && input.value !== "") {
        const message = input.value;
        socket.emit("message", message);
        input.value = "";
      }
    });

    socket.on("createMessage", (message) => {
      ul.innerHTML += `<li class="main__message"><strong>User</strong><br/>${message}</li>`;
      scrollToBottom();
    });
  })
  .catch((err) => {
    console.log("Failed to get local stream", err);
  });

peer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});

const connectToNewUser = (userId, stream) => {
  const call = peer.call(userId, stream);
  console.log("sucess");
  const video = document.createElement("video");
  call.on("stream", (stream) => {
    console.log("succesfully call");
    addVideoStream(video, stream);
  });
  call.on("close", () => {
    video.remove();
  });

  peers[userId] = call;
};

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
};

const scrollToBottom = () => {
  window.scrollTo(0, ul.scrollHeight);
};

// Mute/Unmute our audio
const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
};

const setMuteButton = () => {
  const html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>
  `;
  document.querySelector(".main__muteButton").innerHTML = html;
};

const setUnmuteButton = () => {
  const html = `
    <i class="main__unmute fas fa-microphone-slash"></i>
    <span>Unmute</span>
  `;
  document.querySelector(".main__muteButton").innerHTML = html;
};

// Stop/play our video
const playStop = () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
    setStopVideo();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
};

const setStopVideo = () => {
  const html = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>
  `;
  document.querySelector(".main__videoButton").innerHTML = html;
};

const setPlayVideo = () => {
  const html = `
  <i class="main__stop fas fa-video-slash"></i>
    <span>Play Video</span>
  `;
  document.querySelector(".main__videoButton").innerHTML = html;
};

const hideShowChatWindow = () => {
  const chatWindow = document.querySelector(".main__right");
  if (chatWindow.style.display !== "none") {
    document.querySelector(".main__left").style.flex = 1;
    document.querySelector(".main__right").style.display = "none";
  } else {
    document.querySelector(".main__left").style.flex = 0.8;
    document.querySelector(".main__right").style.display = "flex";
  }
};
