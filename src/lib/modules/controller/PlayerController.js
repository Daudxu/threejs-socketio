import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky'
import { OBB } from 'three/examples/jsm/math/OBB'
import { A, D, DIRECTIONS, S, W } from '../../../utils/KeyDisplay'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils'
import * as TWEEN from '@tweenjs/tween.js'
import gsap from 'gsap'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import * as CANNON from "cannon-es"
import CannonDebugger from 'cannon-es-debugger'
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

import { computed } from 'vue'
import Store from '../../../store/index.js'
import Physics from '../../baseFrame/BasePhysics'

const GROUP1 = 1;
const GROUP2 = 2;
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
  constructor(scene, camera, orbitControls, renderer, physics, playerModel, terrainModel, socket) {
    this.scene = scene
    this.camera = camera
    this.orbitControls = orbitControls
    this.renderer = renderer
    this.physics = physics
    this.cannonDebugger = new CannonDebugger(this.scene, this.physics, {})
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
    this.capsuleBody = null
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
    _this.initPlayer()
    this.scene.add(player)

    _this.setState(this.stateInt)
    _this.socketMessage()
    _this.socketRemovAvatar()
    // _this.initCSS2DRenderer()
    
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
  
  switchRunToggle () {
    this.toggleRun = !this.toggleRun
  }
  //挂载传入角色与响应动画
  initPlayer() {
    let model = SkeletonUtils.clone(this.player.scene)
    const mixer = new THREE.AnimationMixer(model)
    // console.log('this.player.animations', this.player.animations)

    // let walking = mixer.clipAction(this.player.animations[10])
    // let idle = mixer.clipAction(this.player.animations[2])
    // let run = mixer.clipAction(this.player.animations[6])

    // action = {
    //   walking: walking,
    //   idle: idle,
    //   run: run
    // }
    
    // mixers.push(mixer)
 
    player.name = model.name
    player.add(model)
    player.layers.enableAll();
    // this.create2DObject(model.name,player)
  }
  // create2DObject(name,model, type = 'create'){
  //   const labelDiv = document.createElement( 'div' );
  //   labelDiv.className = 'cl-label';
  //   labelDiv.textContent = name;
  //   labelDiv.style.marginTop = '1em';
  //   const moonLabel = new CSS2DObject( labelDiv );
  //   if(type === 'create') {
  //     moonLabel.position.set( 0, 0.6, 0 );
  //   }else{
  //     moonLabel.position.set( 0, 2.6, 0 );
  //   }

  //   // console.log(model.size())
  //   model.add( moonLabel );
  //   moonLabel.layers.set( 0 );
  // }
  // initCSS2DRenderer(){
  //   labelRenderer = new CSS2DRenderer();
  //   labelRenderer.setSize( window.innerWidth, window.innerHeight );
  //   labelRenderer.domElement.style.position = 'absolute';
  //   labelRenderer.domElement.style.top = '0px';
  //   labelRenderer.domElement.style.color = '#ffffff';
  //   labelRenderer.domElement.style.fontWeight = '700';
  //   document.body.appendChild( labelRenderer.domElement );
  // }

  initScenario(scene) {
    let _this = this
    const boxMateralCon = new CANNON.Material("boxMaterial");
    boxMateralCon.friction = 100
    boxMateralCon.restitution = 1
    let plane = SkeletonUtils.clone(this.terrainModel.scene)
    plane.position.set(10.8 , -2.2, 8.5)
    plane.traverse(async (child) => {
      if(child.isMesh){
        var attributes = await child.geometry
        if(attributes){
          let trimeshShape = new CANNON.Trimesh(
            attributes.attributes.position.array,
            attributes.index.array
          )
          let trimeshBody = new CANNON.Body({
              mass: 0,
              shape: trimeshShape,
              material: boxMateralCon,
              position: child.position,
              rotation: child.rotation,
              collisionFilterGroup: GROUP1,
              collisionFilterMask:  GROUP2
          })
          _this.physics.addBody(trimeshBody)
        }
      }
    })
    scene.add(plane)
    const boxMateralCon1 = new CANNON.Material("boxMaterial");
    boxMateralCon1.friction = 100
    boxMateralCon1.restitution = 0
    this.capsuleBody = new CANNON.Body({
      mass: 1,
      position: new CANNON.Vec3(0, 0, -5),
      material: boxMateralCon1,
      collisionFilterGroup: GROUP2,
      collisionFilterMask: GROUP1
    })
    // 球形几何体
    const sphereShape = new CANNON.Sphere(0.5);  
    // 创建圆柱几何体
    const cylinderShape = new CANNON.Cylinder(0.5, 0.5, 1.5, 20);
    this.capsuleBody.addShape(sphereShape, new CANNON.Vec3(0, 0, 0))
    // this.capsuleBody.addShape(cylinderShape, new CANNON.Vec3(0, 0, 0))
    // this.capsuleBody.addShape(sphereShape, new CANNON.Vec3(0, -0.75, 0))
    // this.capsuleBody 
    this.capsuleBody.body.fixedRotation = true;
		this.capsuleBody.body.updateMassProperties();
    this.physics.addBody(this.capsuleBody)
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

  move(deltaX, deltaY) {
    this.theta -= deltaX * (0.3 / 2);
    this.theta %= 360;
    this.phi += deltaY * (0.24 / 2);
    this.phi = Math.min(85, Math.max(-85, this.phi));
  }

  handleMouseMove(event, deltaX, deltaY) {
    this.move(deltaX, deltaY);
  }

  handleOnmouseWheel(event) {
    if(event.wheelDelta < 0){
      this.radius += 0.1
    }else if(event.wheelDelta > 0){
      this.radius -= 0.1
    }
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

  addPhysics(planeGroup) {
    this.physics = new Physics(planeGroup, this.camera, this.scene);
    return this.physics;
  }

  update=()=> {
    const delta = clock.getDelta();
    this.physics.step(1 / 60, delta);
    if(this.capsuleBody){
      player.position.copy(this.capsuleBody.position)
      // player.quaternion.copy(this.capsuleBody.quaternion)
    }

    this.cannonDebugger.update();
    const directionPressed = DIRECTIONS.some(key => this.keysPressed[key] == true)
      // console.log("directionPressed", typeof this.keysPressed)
    var play = '';
    if (directionPressed) {
        play = 'Run'
    } else {
        play = 'Idle'
    }
    if (this.currentAction != play) {
      this.currentAction = play
    }
    const isInpt = computed(() => this.storeObj.useAppStore.getIsInpt)
    if ((this.currentAction == 'Run' || this.currentAction == 'Walk') && !isInpt.value) {
      // console.log('player.position.x', player.position.x)
      // 摄像机方向计算
      var angleYCameraDirection = Math.atan2(
              (this.camera.position.x - player.position.x), 
              (this.camera.position.z - player.position.z))
      // 对角线移动角度偏移
      directionOffset = this.directionOffset(this.keysPressed, 'back')
      directionOffseta = this.directionOffset(this.keysPressed, 'front')
      // rotate model
      this.rotateQuarternion.setFromAxisAngle(this.rotateAngle, angleYCameraDirection + directionOffset)
      player.quaternion.rotateTowards(this.rotateQuarternion, 0.2)
      
      // calculate direction
      this.camera.getWorldDirection(this.walkDirection)
      this.walkDirection.y = 0
      this.walkDirection.normalize()
      this.walkDirection.applyAxisAngle(this.rotateAngle, directionOffseta)

      // run/walk velocity
      const velocity = this.currentAction == 'Run' ? runVelocity : walkVelocity

      // move model & camera
      const moveX = this.walkDirection.x * velocity * delta
      const moveZ = this.walkDirection.z * velocity * delta
      this.capsuleBody.position.x += moveX
      this.capsuleBody.position.z += moveZ
      this.updateCameraTarget(moveX, moveZ)
  }
    // labelRenderer.render( this.scene, this.camera );
    //动画
    if (mixers) {
      for (const mixer of mixers) mixer.update(delta);
    }
    this.orbitControls.update()
    let obj = {
      playerPosition: player.position,
      playerQuaternion: player.quaternion,
      state: this.playerAnimationsState,
      id: this.player.scene.name,
    }
    this.socket.emit('message', obj);
  }
}
