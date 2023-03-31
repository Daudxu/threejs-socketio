<template>
  <div class="cl-create-avatar">
    <input v-model="name"/>
    <button @click="handleClickCreateAvatar">创建角色</button>
  </div>
  <div id="container" class="container" ref="container">
  </div>
</template>

<script setup>
import * as THREE from "three";
import { renderAPI } from "./lib/renderAPI";
import io from 'socket.io-client'
import { onMounted, ref } from "vue"

const socket = io('http://localhost:3000');
const name = ref()
const hotZoneData = ref(null)
const container = ref()

onMounted(() => {
  // window.addEventListener('DOMContentLoaded', function () {
  //   socketIo()
  // })
});

const handleClickCreateAvatar = async () => {
    await connectSocket()
    initThree(socket)
}
// 连接到webSocket
const connectSocket = () => {
    socket.on('connect',function(){
      console.log('连接成功');
      socket.send('welcome');
    });
}
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

</script>

<style>
.cl-create-avatar {
  position: fixed;
  top: 0;
  left: 0;
  background: #000000;
  z-index: 999;
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
