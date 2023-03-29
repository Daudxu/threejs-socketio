<template>
  <div id="blocker" style="width:100%;height: 100%;">
    <div v-if="hideCanvas" style="width:100%;height: 100%;background-color: black">
      <input v-model="name"/>
      <button @click="confirmClick">确认</button>
    </div>
    <div v-else style="width: 100%;height: 100%;"
         id="container" ref="container">
    </div>
  </div>
</template>

<script setup>
import * as THREE from "three";
import { renderAPI } from "./lib/renderAPI";
import io from 'socket.io-client'
import { onMounted, ref } from "vue"

const socket = io('http://localhost:3000');
const hideCanvas = ref(true)
const name = ref()
const hotZoneData = ref(null)
const container = ref()


onMounted(() => {
  window.addEventListener('DOMContentLoaded', function () {
    socketIo()
  })
});

const initData = () => {
  // let that=this
  // this.$axios.get('http://localhost:3000/hotZone').then(function (response) {
  //   console.log(response);
  //   that.hotZoneData=response.data
  // }).catch(function (error) {
  //   console.log(error);
  // });
}

const socketIo = () => {
    socket.on('connect',function(){
      console.log('连接成功');
      //客户端连接成功后发送消息'welcome'
      // socket.send('welcome');
    });
}

const initThree = () => {
    // container = document.getElementById('container')
    let containerObj = container.value
    console.log('containerObj', containerObj)
    let config={
      playerName:name,
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

const confirmClick = () => {
  hideCanvas.value = false
  initData()
  setTimeout(()=>{
    initThree()
  },100)
  // $forceUpdate()
}
</script>

<style>
* { 
  margin: 0;
  padding: 0;
}
#container {
  width: 100vw;
  height: 100vh;
}
</style>
