<template>
  <div class="cl-create-avatar" v-if="isShowCreateAvatar">
     <div>
      <swiper
        :effect="'cards'"
        :grabCursor="true"
        :modules="EffectCards"
        @swiper="onSwiper"
        @slideChange="onSlideChange"
        class="mySwiper"
      >
        <swiper-slide>
          <img src="@/assets/images/1.png" />
        </swiper-slide>
        <swiper-slide>
          <img src="@/assets/images/2.png" />
        </swiper-slide>
        <swiper-slide>
          <img src="@/assets/images/3.png" />
        </swiper-slide>
      </swiper>
      <input v-model="name" class="name"/>
      &nbsp;&nbsp;
      <button @click="() => handleClickCreateRandomName()">随机名称</button>
      &nbsp;&nbsp;
      <button @click="() => handleClickCreateAvatar()">创建角色</button>
    </div>
  </div>
  <div class="cl-chat">
     <div class="cl-main"> 
         <div id="audios-container" refs="audiosDom"></div>
         <div class="cl-chat-content" ref="chatContent">
          <p v-for="(item, index) in msgData.list" :key="index" >
             <span v-html="item"></span>
          </p>
         </div>
         <div class="cl-chat-form">
             <div class="cl-chat-input">
                <input type="text" class="cl-chat-msg" @blur="handleClickIsInpt(false)" @focus="handleClickIsInpt(true)"  @keyup.enter="handleClickEmj" v-model="msg"  />
                <button class="cl-send-emj" >表情</button>
             </div>
            <button class="cl-send-chat" @click="handleClickTest">Send</button>
            <button class="cl-send-voice" @click="handleClickVoice">语音</button>
         </div>
     </div>
  </div>
  <div class="cl-online-users">
      <div class="cl-user-count">Online User {{  playerCount }}</div>
      <div class="cl-user-list">
        <ul>
           <li v-for="(item, index) in users.list" :key="index">{{ item }}</li> 
        </ul>
      </div>
  </div>
  <div id="container" class="container" ref="container">
  </div>
</template>

<script setup>
import * as THREE from "three";
import { renderAPI } from "./lib/renderAPI";
import  { getHTMLMediaElement }  from "./getHTMLMediaElement";
import io from 'socket.io-client'
import RTCMultiConnection from 'RTCMultiConnection';
import { onMounted, ref, reactive, nextTick, computed } from "vue"
import { Swiper, SwiperSlide } from 'swiper/vue';
import { EffectCards } from 'swiper';
// import * as io from 'socket.io-client'
window.io = io
import adapter from 'webrtc-adapter';
import 'swiper/css/effect-cards';
import 'swiper/css';
import Store from './store/index.js'
let audiosDom = ref("")
const Pinia  = Store()
const socket = io('ws://localhost:3000');

const connection = new RTCMultiConnection();
connection.socketURL = 'https://webrtc.3helper.com/';
connection.socketMessageEvent = 'audio-conference-demo';
connection.session = {
    audio: true,
    video: false
};
connection.mediaConstraints = {
    audio: true,
    video: false
};
connection.sdpConstraints.mandatory = {
    OfferToReceiveAudio: true,
    OfferToReceiveVideo: false
};




const isInput = computed(() => Pinia.useAppStore.getIsInpt)

const isShowCreateAvatar = ref(true)
let name = ref()

let users = reactive({
    list: []
})
let msg = ref("")
let msgData = reactive({
    list: []
})
let chatContent = ref()
const hotZoneData = ref(null)
const container = ref()
const playerCount = ref(0)
const glbModelPath = ref()
const roleList = [
'./1.glb',
'./2.glb',
'./3.glb'
];

const onSwiper = (swiper) => {
   glbModelPath.value = roleList[0]
} 
const params = {}
const onSlideChange = (e) => {
  let pageIndex = e.activeIndex;
  glbModelPath.value = roleList[pageIndex]
}
const handleClickCreateRandomName = () => {
    name.value = randomName()
}

const randomName = () => {
  const firstName = ["John", "Mary", "David", "Paul", "Mark", "James", "Michael", "Joseph", "Richard", "Charles",
              "Thomas", "Christopher","Daniel","Matthew","Anthony","Donald","Elizabeth","Kenneth","Susan","Margaret"];
  const lastName = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'];

  const randomFirstNameIndex = Math.floor(Math.random() * firstName.length);
  const randomLastNameIndex = Math.floor(Math.random() * lastName.length);

  return `${firstName[randomFirstNameIndex]}-${lastName[randomLastNameIndex]}`;
}

onMounted(() => {
  socket.on('connect', () => console.log('connect: websocket 连接成功！'))
  // 监听系统消息
  socket.on('system', function (sysMsg, userList) {
    appendMsg("system", sysMsg)
    playerCount.value = userList.length
    users.list = userList
  });
  // 监听房间消息
  socket.on('roomMessage', function (userName, userMessage) {
    appendMsg(userName, userMessage)
  });
  name.value = randomName()

// https://www.rtcmulticonnection.org/docs/iceServers/
// use your own TURN-server here!
connection.iceServers = [{
    'urls': [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
        'stun:stun.l.google.com:19302?transport=udp',
    ]
}];
connection.audiosContainer = document.getElementById('audios-container');
// connection.audiosContainer = audiosDom;
connection.onstream = function(event) {
    console.log("==================event===================", event)
    console.log("connection.audiosContainer", connection.audiosContainer)
    var width = parseInt(connection.audiosContainer.clientWidth / 2) - 20;
    var mediaElement = getHTMLMediaElement(event.mediaElement, {
        title: event.userid,
        buttons: ['full-screen'],
        width: width,
        showOnMouseEnter: false
    });

    connection.audiosContainer.appendChild(mediaElement);

    setTimeout(function() {
        console.log("===========")
        mediaElement.media.play();
    }, 5000);

    mediaElement.id = event.streamid;
};

connection.onstreamended = function(event) {
   console.log("=================event=================", event)
    // var mediaElement = document.getElementById(event.streamid);
    if (mediaElement) {
        mediaElement.parentNode.removeChild(mediaElement);
        console.log("=================event=================", event)
    }
};



  var roomid = '';
if (localStorage.getItem(connection.socketMessageEvent)) {
    roomid = localStorage.getItem(connection.socketMessageEvent);
} else {
    roomid = connection.token();
}
console.log("roomid", roomid)
// document.getElementById('room-id').value = roomid;
// document.getElementById('room-id').onkeyup = function() {
//     localStorage.setItem(connection.socketMessageEvent, this.value);
// };

var hashString = location.hash.replace('#', '');
if (hashString.length && hashString.indexOf('comment-') == 0) {
    hashString = '';
}

var roomid = params.roomid;
if (!roomid && hashString.length) {
    roomid = hashString;
}

if (roomid && roomid.length) {
    // document.getElementById('room-id').value = roomid;
    localStorage.setItem(connection.socketMessageEvent, roomid);

    // auto-join-room
    (function reCheckRoomPresence() {
        connection.checkPresence(roomid, function(isRoomExist) {
            if (isRoomExist) {
                connection.join(roomid);
                return;
            }
            setTimeout(reCheckRoomPresence, 5000);
        });
    })();

    // disableInputButtons();
}
});
// 创建角色
const handleClickCreateAvatar = async () => {
  if(name.value && name.value !== 'undefined') {
    // 加入房间
    joinRoom(name.value)
    // getPlayerCount(socket)
    // socket.emit('broadcast', name.value);
    initThree(socket)
    isShowCreateAvatar.value = false
  }else{
    alert('请输入角色名称')
  }
}
// 加入房间
const joinRoom = (userName) => {
  socket.emit('join', userName);
}
// 初始化角色
const initThree = (socket) => {
    const containerObj = container.value
    let config={
      playerName:name.value,
      socket:socket,
      hotZoneData:hotZoneData
    }
    if (containerObj) {
      renderAPI()
        .initialize(containerObj,config)
        .then((apiInstance) => {
          apiInstance.startRender();
        })
        .catch();
    }
}
// 发送消息
const handleClickTest = () => {
  if(msg.value){
    socket.emit('roomMessage', msg.value);
    msg.value = ""
  }
}
// 语音
const handleClickVoice = () => {
  connection.openOrJoin("myroom", function(isRoomExist, roomid) {
        if (!isRoomExist) {
            // showRoomURL(roomid);
            console.log("roomid", roomid)
        }
  });
}
// 滚动
const scrollToBottom = () => {
  nextTick(() => {
    let scrollElem = chatContent.value;
    scrollElem.scrollTo({
      top: scrollElem.scrollHeight,
      behavior: 'smooth'
    });
  });
}
// 是否再输入
const handleClickIsInpt = (e) => {
  Pinia.useAppStore.setIsInpt(e)
}
// 表情包
const handleClickEmj = (e) => {
  Pinia.useAppStore.setIsInpt(e)
}

const appendMsg = (userName, userMessage) => {
  let msgDom = `<span class="cl-sendName">${userName}:&nbsp;</span> <span class="cl-sendMsg">${userMessage} </span>`
  msgData.list.push(msgDom)
  scrollToBottom()
}

</script>

<style lang="stylus">
// chat style
.cl-chat {
  position: fixed
  width: 380px
  height: 380px
  bottom: 30px;
  left: 15px;
  border-radius: 18px
  background-color:rgba(0,0,0,0.2);
  padding: 17px
  .cl-chat-content {
    width: 380px
    height: 338px
    margin-bottom: 10px
    overflow-y: auto
    &::-webkit-scrollbar {
      width: 10px;  
      height: 1px;
    }
    &::-webkit-scrollbar-thumb {
      border-radius: 10px;
      -webkit-box-shadow: inset 0 0 5px rgba(0,0,0,0.2);
      background: #535353;
    }
    &::-webkit-scrollbar-track {
      -webkit-box-shadow: inset 0 0 5px rgba(0,0,0,0.2);
      border-radius: 10px;
      background: #EDEDED;
    }
    p {
      span {
        font-family: 'Inter', sans-serif;
        color: #000000
        font-size:17px
        line-height: 25px
      }
      .cl-sendName{
        font-family: 'Inter', sans-serif;
        color: #ffffff
      }
      .cl-sendMsg {
        font-family: 'Inter', sans-serif;
        color: #ffffff
      }
    }
  }
  .cl-chat-form {
    display: flex
    justify-content: space-between
    .cl-chat-input {
      position: relative
      width: 280px
      display: flex
      padding:  0 8px
      background-color: rgba(0,0,0,0.5);
      border-radius: 18px
      .cl-chat-msg {
          background-color: rgba(0,0,0,0.0);
          color: #ffffff
          border-radius: 18px
          width: 90%
      }
      .cl-send-emj {
        position: absolute
        right: 0;
        top: 0
        background-color:rgba(0,0,0,0.5);
        width: 30px
        height: 30px
        color: #ffffff
        font-size: 10px
        border-radius: 18px
        cursor: pointer
      }
    }
    .cl-send-chat {
      width: 45px
      height: 30px
      background-color:rgba(0,0,0,0.5);
      font-size: 8px
      color: #ffffff
      border-radius:18px
      margin-left: 10px
      cursor: pointer
    }
    .cl-send-voice{
      width: 30px
      height: 30px
      background-color:rgba(0,0,0,0.5);
      font-size: 8px
      color: #ffffff
      border-radius:18px
      margin-left: 10px
      cursor: pointer
    }
  }
}

// online users style
.cl-online-users {
  position: fixed
  width: 150px
  height: 185px
  top: 20%;
  right: 15px;
  border-radius: 18px
  background-color:rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column
  .cl-user-count {
    font-family: 'Inter', sans-serif;
    color: #ffffff
    font-weight: bold
    text-align: center
    padding: 10px 10px 5px 10px
  }
  .cl-user-list {
    padding: 0 5px 5px 5px
    ul {
      height: 150px
      overflow-y: auto
      li {
        font-family: 'Inter', sans-serif;
        color: #05ff5e
        padding: 5px
        font-weight: 200
        text-align: left
        border-bottom: 1px dashed rgba(0,0,0,0.2);
      }
      &::-webkit-scrollbar {
        width: 10px;  
        height: 1px;
      }
      &::-webkit-scrollbar-thumb {
        border-radius: 10px;
        -webkit-box-shadow: inset 0 0 5px rgba(0,0,0,0.2);
        background: #535353;
      }
      &::-webkit-scrollbar-track {
        -webkit-box-shadow: inset 0 0 5px rgba(0,0,0,0.2);
        border-radius: 10px;
        background: #EDEDED;
      }
    }
  }
}

.swiper {
  width: 240px;
  height: 320px;
  margin-bottom: 16px
}

.swiper-slide {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  font-size: 22px;
  font-weight: bold;
  color: #fff;
  img {
    width: 200px
  }
}

.swiper-slide:nth-child(1n) {
  background-color: #43a8e2
}

.swiper-slide:nth-child(2n) {
  background-color: #43a8e2
}

.swiper-slide:nth-child(3n) {
  background-color: #43a8e2
}

@keyframes lineAni {
  to {
     stroke-dashoffset: 0
  }
}
@keyframes fillAni {
  from {
    fill: transparent
  }
  to {
    fill: #ffffff
  }
}

@keyframes jump {
  0% {
    transform: translate3d(0, 0, 0);
    text-shadow: rgba(255, 255, 255, 0.4) 0 0 0.05em;
  }
  100% {
    transform: translate3d(0, -1em, 0);
    text-shadow: rgba(255, 255, 255, 0.4) 0 1em 0.35em;
  }
}

@font-face {
  font-family: scorefont;
  src: url('./assets/font/digital_number.ttf')
}

.cl-create-avatar {
  position: fixed;
  width: 100%
  height:  100%
  background: #000000;
  z-index: 999;
  display: flex
  justify-content: center
  align-items: center
  .name {

  }
}

* { 
  margin: 0;
  padding: 0;
}
#container {
  width: 100vw;
  height: 100vh;
}
</style>
