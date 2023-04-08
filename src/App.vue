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
      <button @click="() => handleClickCreateAvatar()">创建角色</button>
    </div>
  </div>
  <div class="cl-chat">
     <div class="cl-main"> 
         <div class="cl-chat-content"></div>
         <div class="cl-chat-send">
            <input type="text" name="message"/>
            <button @click="handleClickTest">Send</button>
         </div>
     </div>
  </div>
  <div class="cl-online-players">
      <div>Online User {{  playerCount }}</div>
      <div>
        <ul>
           <li v-for="(item, index) in users.list" :key="index">{{ item.name }}</li>
        </ul>
      </div>
  </div>
  <div id="container" class="container" ref="container">
  </div>
</template>

<script setup>
import * as THREE from "three";
import { renderAPI } from "./lib/renderAPI";
import io from 'socket.io-client'
import { onMounted, ref, reactive } from "vue"
import { Swiper, SwiperSlide } from 'swiper/vue';
import { EffectCards } from 'swiper';
import 'swiper/css/effect-cards';
import 'swiper/css';

const socket = io('ws://localhost:3000');
socket.emit('join', {'room': 'myroom'})

const isShowCreateAvatar = ref(true)
let name = ref()
let users = reactive({
    list: []
})

const hotZoneData = ref(null)
const container = ref()
const playerCount = ref(0)
const glbModelPath = ref()
const roleList = [
'./1.glb',
'./2.glb',
'./3.glb'
];
// let socket = null;

const onSwiper = (swiper) => {
   glbModelPath.value = roleList[0]
} 

const onSlideChange = (e) => {
  let pageIndex = e.activeIndex;
  glbModelPath.value = roleList[pageIndex]
}

onMounted(() => {

  socket.on('connect', () => console.log('connect: websocket 连接成功！'))
  socket.on('broadcast', (message) => {
      var count = message.length;
      users.list = message
      playerCount.value = count
  })
});

const handleClickCreateAvatar = async () => {
  // alert(111)
  if(name.value && name.value !== 'undefined') {
  
    // await connectSocket(socket)
    // getPlayerCount(socket)
    socket.emit('broadcast', name.value);
    initThree(socket)
    isShowCreateAvatar.value = false
  }else{
    alert('请输入角色名称')
  }
}
// 连接到webSocket
// const connectSocket = (socket) => {
//     socket.on('connect',function(){
//       console.log('连接成功');
//       socket.emit('broadcast', { message: 'A new user has connected!' });

//     });
// }


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

const handleClickTest = () => {
  socket.emit('broadcast', { message: 'A new user has connected!' });
}

</script>

<style lang="stylus">

.cl-chat {
  position: fixed
  width: 380px
  height: 380px
  background: #ffffff
  bottom: 30px;
  left: 30px;
  border-radius: 18px
}

.cl-online-players {
  position: fixed
  width: 130px
  height: 180px
  background: #ffffff
  top: 20%;
  right: 30px;
  border-radius: 18px
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
