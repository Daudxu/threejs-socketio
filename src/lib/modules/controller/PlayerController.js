import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky'
import { OBB } from 'three/examples/jsm/math/OBB'
import { A, D, DIRECTIONS, S, W } from '../../../utils/KeyDisplay'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils'
import * as TWEEN from '@tweenjs/tween.js'
import gsap from 'gsap'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { Octree } from "three/examples/jsm/math/Octree.js";
import { OctreeHelper } from "three/examples/jsm/helpers/OctreeHelper.js";
import { Capsule } from "three/examples/jsm/math/Capsule.js";

import { computed } from 'vue'
import Store from '../../../store/index.js'
import Physics from '../../baseFrame/BasePhysics'
const clock = new THREE.Clock();


let player = new THREE.Group()//角色
let ball = new THREE.Vector3()//保存点击坐标

let distVec; //距离
let targetVecNorm;
let colliders = []

//动画
let mixers = []
let action
let tween
let labelRenderer
const runVelocity = 5
const walkVelocity = 2

let directionOffset, directionOffseta
export default class PlayerController {
  constructor(scene, camera, orbitControls, renderer, playerModel, terrainModel, socket) {
    this.scene = scene
    this.camera = camera
    this.orbitControls = orbitControls
    this.renderer = renderer
    this.player = playerModel
    this.terrainModel = terrainModel
    this.socket = socket
    this.currentAction = 'Run'
    this.rotateQuarternion = new THREE.Quaternion()
    this.cameraTarget = new THREE.Vector3()
    this.walkDirection = new THREE.Vector3()
    this.rotateAngle = new THREE.Vector3(0, 1, 0)
    this.storeObj  = Store()
    this.target = new THREE.Vector3()

    this.radius = 3;
    this.theta = 0;
    this.phi = 0;
    //控制方式
    this.stateInt = 0

    this.playerAnimationsState = "idle"
    this.playerAnimationsArr = []
    this.planeArr=[]
    this.toggleRun = true
    this.init()
    this.initScenario(this.scene)
    this.initSky()
    this.keysPressed = {}
  }

  init() {
    let _this = this
    // _this.initPlayer()
    this.scene.add(player)
    _this.setState(this.stateInt)
    _this.socketMessage()
    _this.socketRemovAvatar()

    window.addEventListener('keydown', (event) => {
      if (event.shiftKey && _this.player) {
          _this.switchRunToggle()
      } else {   
          (_this.keysPressed)[event.key.toLowerCase()] = true
      }
    }, false);
    window.addEventListener('keyup', (event) => {
          (_this.keysPressed)[event.key.toLowerCase()] = false
    }, false);
  }

  addPhysics(planeGroup) {
    this.physics = new Physics(planeGroup, this.camera, this.scene, this.player, this.orbitControls);
    return this.physics;
  }
  
  switchRunToggle () {
    this.toggleRun = !this.toggleRun
  }
   //创建一个地板，如果只有网格，不能得到点击位置的坐标
  initScenario(scene) {
    let planeModel = this.terrainModel.scene
    let planeGroup = new THREE.Group();
    planeGroup.position.copy(planeModel.children[0].position);
    planeModel.traverse((child) => {
      if (
        child.isMesh &&
        child.material &&
        child.material.name.indexOf("KB3D_DLA_ConcreteRiverRock") != -1
      ) {
        planeGroup.add(child.clone());
        child.visible = false;
      }
      if (
        child.isMesh &&
        child.material &&
        child.material.name.indexOf("KB3D_DLA_ConcreteScreedTan") != -1
      ) {
        planeGroup.add(child.clone());
        child.visible = false;
      }
      if (
        child.isMesh &&
        child.material &&
        child.material.name.indexOf("KB3D_DLA_ConcretePittedGrayLight") != -1
      ) {
        planeGroup.add(child.clone());
        child.visible = false;
      }
    })
    this.addPhysics(planeGroup)
    planeModel.add(planeGroup)
    // let plane = SkeletonUtils.clone(this.terrainModel.scene)
    scene.add(planeModel)
  }
  
   // front, back, left, right
  directionOffset(keysPressed, toward = "front" ) {
    if(toward === 'front'){
        var directionOffset = 0 // w

        if (keysPressed[W]) {
            if (keysPressed[A]) {
                directionOffset = Math.PI / 4 // w+a
            } else if (keysPressed[D]) {
                directionOffset = - Math.PI / 4 // w+d
            }
        } else if (keysPressed[S]) {
            if (keysPressed[A]) {
                directionOffset = Math.PI / 4 + Math.PI / 2 // s+a
            } else if (keysPressed[D]) {
                directionOffset = -Math.PI / 4 - Math.PI / 2 // s+d
            } else {
                directionOffset = Math.PI // s
            }
        } else if (keysPressed[A]) {
            directionOffset = Math.PI / 2 // a
        } else if (keysPressed[D]) {
            directionOffset = - Math.PI / 2 // d
        }
        return directionOffset
    }else if(toward === 'back'){
        var directionOffset = Math.PI  // w

        if (keysPressed[W]) {
            if (keysPressed[A]) {
                directionOffset = -Math.PI / 4 - Math.PI / 2  // w+a
            } else if (keysPressed[D]) {
                directionOffset =  Math.PI / 4 + Math.PI / 2 // w+d
            }
        } else if (keysPressed[S]) {
            if (keysPressed[A]) {
                directionOffset = Math.PI / 4 - Math.PI / 2 // s+a
            } else if (keysPressed[D]) {
                directionOffset =  - Math.PI / 4 + Math.PI / 2// s+d
            } else {
                directionOffset = 0 // s
            }
        } else if (keysPressed[A]) {
            directionOffset = -Math.PI / 2 // a
        } else if (keysPressed[D]) {
            directionOffset =  Math.PI / 2 // d
        }
        return directionOffset
    }
  }

  // 创建天空环境
  initSky() {
      const sky = new Sky()
      sky.scale.setScalar(10000)
      sky.name = "Sky"
      this.scene.add(sky)

      const skyUniforms = sky.material.uniforms;
      skyUniforms['turbidity'].value = 10;
      skyUniforms['rayleigh'].value = 2;
      skyUniforms['mieCoefficient'].value = 0.005;
      skyUniforms['mieDirectionalG'].value = 0.8;
      
      const parameters = {
        elevation: 2,
        azimuth: 180
      };
      // const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      
      let sun = new THREE.Vector3();
      
      function updateSun() {
      
        const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
        const theta = THREE.MathUtils.degToRad(parameters.azimuth);

        sun.setFromSphericalCoords(1, phi, theta);

        sky.material.uniforms['sunPosition'].value.copy(sun);
        // water.material.uniforms[ 'sunDirection' ].value.copy( sun ).normalize();

        // this.scene.environment = pmremGenerator.fromScene( sky ).texture;
      }
      updateSun();
  }

  setState(state) {
    this.stateInt = state
  }

  socketRemovAvatar() {
    this.socket.on('removAvatar', (user) => {
      let model = this.scene.getObjectByName(user)
      this.scene.remove(model)
    })
  }
  socketMessage() {
    this.socket.on('message', (message) => {

      // let walking
      // let idle
      // let run

      if (message.id) {
        let model = this.scene.getObjectByName(message.id)
        if (model) {
          model.position.set(message.playerPosition.x, message.playerPosition.y, message.playerPosition.z)
          if (message.playerQuaternion) {
            model.quaternion.set(message.playerQuaternion._x,message.playerQuaternion._y,message.playerQuaternion._z,message.playerQuaternion._w)
          }
          // if(this.playerAnimationsArr.length>0){
          //   this.playerAnimationsArr.forEach(item=>{
          //     if(item.name==model.name){
          //       switch (message.state) {
                  // case "idle":
                  //   item.action.run.stop()
                  //   item.action.idle.play()
                  //   break
                  // case "run":
                  //   item.action.idle.stop()
                  //   item.action.run.play()
                  //   break
          //       }
          //     }
          //   })
          // }
        } else {
          let model = SkeletonUtils.clone(this.player.scene)
          model.name = message.id
          // let mixer = new THREE.AnimationMixer(model)
          // walking = mixer.clipAction(this.player.animations[10])
          // idle = mixer.clipAction(this.player.animations[2])
          // run = mixer.clipAction(this.player.animations[6])
          // let obj={
          //   name:message.id,
          //   action : {
          //     walking: walking,
          //     idle: idle,
          //     run: run
          //   }
          // }
          // this.playerAnimationsArr.push(obj)
          // this.create2DObject(message.id, model, 'update')
          this.scene.add(model)
          // mixers.push(mixer)
        }
      }
    });
  }

   updateCameraTarget(moveX, moveZ) {
    // move camera
    this.camera.position.x += moveX
    this.camera.position.z += moveZ
  
    // update camera target
    this.cameraTarget.x = player.position.x
    this.cameraTarget.y = player.position.y + 1
    this.cameraTarget.z = player.position.z
    this.orbitControls.target = this.cameraTarget
  }



  update=()=> {
    const delta = clock.getDelta();
    if (this.physics) {
      this.physics.update(delta, player);
    }
    // const directionPressed = DIRECTIONS.some(key => this.keysPressed[key] == true)
    //   // console.log("directionPressed", directionPressed)
    // var play = '';
    // if (directionPressed) {
    //     play = 'Run'
    // } else {
    //     play = 'Idle'
    // }
    // if (this.currentAction != play) {
    //   this.currentAction = play
    // }
    // const isInpt = computed(() => this.storeObj.useAppStore.getIsInpt)
  //   if ((this.currentAction == 'Run' || this.currentAction == 'Walk') && !isInpt.value) {
  //     // console.log('player.position.x', player.position.x)
  //     // 摄像机方向计算
  //     var angleYCameraDirection = Math.atan2(
  //             (this.camera.position.x - player.position.x), 
  //             (this.camera.position.z - player.position.z))
  //     // 对角线移动角度偏移
  //     directionOffset = this.directionOffset(this.keysPressed, 'back')
  //     directionOffseta = this.directionOffset(this.keysPressed, 'front')
  //     // rotate model
  //     this.rotateQuarternion.setFromAxisAngle(this.rotateAngle, angleYCameraDirection + directionOffset)
  //     player.quaternion.rotateTowards(this.rotateQuarternion, 0.2)

  //     // calculate direction
  //     this.camera.getWorldDirection(this.walkDirection)
  //     this.walkDirection.y = 0
  //     this.walkDirection.normalize()
  //     this.walkDirection.applyAxisAngle(this.rotateAngle, directionOffseta)

  //     // run/walk velocity
  //     const velocity = this.currentAction == 'Run' ? runVelocity : walkVelocity

  //     // move model & camera
  //     const moveX = this.walkDirection.x * velocity * delta
  //     const moveZ = this.walkDirection.z * velocity * delta
  //     player.position.x += moveX
  //     player.position.z += moveZ
  //     this.updateCameraTarget(moveX, moveZ)
  // }
    // labelRenderer.render( this.scene, this.camera );
    //动画
    // if (mixers) {
    //   for (const mixer of mixers) mixer.update(delta);
    // }
    // this.selectController(delta)
    this.orbitControls.update()
    // let obj = {
    //   playerPosition: player.position,
    //   playerQuaternion: player.quaternion,
    //   state: this.playerAnimationsState,
    //   id: this.player.scene.name,
    // }
    // this.socket.emit('message', obj);
  }
}
