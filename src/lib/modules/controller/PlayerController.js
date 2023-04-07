import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky'
import { OBB } from 'three/examples/jsm/math/OBB'
import { A, D, DIRECTIONS, S, W } from '../../../utils/KeyDisplay'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils'
import * as TWEEN from '@tweenjs/tween.js'
import gsap from 'gsap'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

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


export default class PlayerController {
  constructor(scene, camera, renderer, playerModel, socket) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.player = playerModel
    this.socket = socket
    this.currentAction = 'Run'
    this.rotateQuarternion = new THREE.Quaternion()

    this.walkDirection = new THREE.Vector3()
    this.rotateAngle = new THREE.Vector3(0, 1, 0)

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
    _this.initPlayer()
    this.scene.add(player)

    this.createCameras()
    window.addEventListener('click', function (ev) {
      _this.rayPlane(ev)
    }, false)
    // window.addEventListener('keydown', function (e) {
    //   _this.keyDownWalk(e);
    // });
    _this.setState(this.stateInt)
    _this.socketMessage()
    // _this.initCSS2DRenderer()

    window.addEventListener('keydown', (event) => {
      // keyDisplayQueue.down(event.key)
      if (event.shiftKey && _this.player) {
          // console.log("==1=", event.shiftKey);
          _this.switchRunToggle()
      } else {
          
          (_this.keysPressed)[event.key.toLowerCase()] = true
      }
      // console.log("==keydown=", _this.keysPressed);
  }, false);
  window.addEventListener('keyup', (event) => {
      // keyDisplayQueue.up(event.key);
      (_this.keysPressed)[event.key.toLowerCase()] = false
      // console.log("==keyup=", _this.keysPressed);
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
    //创建一个地板，如果只有网格，不能得到点击位置的坐标
    let geometry = new THREE.PlaneGeometry(8, 8)
    geometry.rotateX(-Math.PI / 2)
    let mail = new THREE.MeshBasicMaterial({color: 0x696969})
    let plane = new THREE.Mesh(geometry, mail)
    plane.name = 'Plane'
    plane.receiveShadow = true
    scene.add(plane)
    this.planeArr.push(plane)
  }
  keyDownWalk(e) {
    // // 模型朝向
    // var vector = new THREE.Vector3();
    // var vectora = this.camera.getWorldDirection(vector);
    // console.log("vectora", vectora)
    // // var theta = Math.atan2(vector.x,vector.z);

    // let keyCode = e.keyCode;
    // let position = player.position, rotation = player.rotation.y;
    // switch (keyCode) {
    //     case 87:        //w
    //         // console.log("vector", this.camera.rotation.y)
    //         // player.rotation.y = this.camera.rotation.y
    //         // player.lookAt(vectora.x, 0, 0)
    //         position.x += 0.01 * Math.cos(rotation);
    //         position.z += 0.01 * Math.sin(-rotation);
    //         break;
    //     case 65:        //a
    //         position.x += 0.001 * Math.cos(rotation + Math.PI/2);
    //         position.z += 0.001 * Math.sin(-rotation - Math.PI/2);
    //         break;
    //     case 68:        //d
    //         position.x += 0.001 * Math.cos(rotation - Math.PI/2);
    //         position.z += 0.001 * Math.sin(-rotation + Math.PI/2);
    //         break;
    //     case 83:        //s
    //         // player.lookAt(vectora.x, 0, vectora.z)
    //         position.x -= 0.001 * Math.cos(rotation);
    //         position.z -= 0.001 * Math.sin(-rotation);
    //         break;
    //     default:
    //         break;
    // }

  }
  rayPlane(ev) {
    // this.onMouseDblclick(ev)
    // ev.preventDefault()
    // let getBoundingClientRect = container.getBoundingClientRect()
    // // 屏幕坐标转标准设备坐标
    // let x = ((ev.clientX - getBoundingClientRect.left) / container.offsetWidth) * 2 - 1// 标准设备横坐标
    // let y = -((ev.clientY - getBoundingClientRect.top) / container.offsetHeight) * 2 + 1// 标准设备纵坐标
    // let standardVector = new THREE.Vector3(x, y, 1)// 标准设备坐标
    // // 标准设备坐标转世界坐标
    // let worldVector = standardVector.unproject(this.camera)
    // // 射线投射方向单位向量(worldVector坐标减相机位置坐标)
    // let ray = worldVector.sub(this.camera.position).normalize()
    // // 创建射线投射器对象
    // let rayCaster = new THREE.Raycaster(this.camera.position, ray)
    // // 返回射线选中的对象 第二个参数如果不填 默认是false
    // let intersects = rayCaster.intersectObjects(this.planeArr, true)

    // if (intersects.length > 0) {
    //   // console.log(intersects)
    //   if (intersects[0].object.name == "Plane") {
    //       let targetVec = intersects[0].point
    //       ball = targetVec.clone()
    //       distVec = ball.distanceTo(player.position)
    //       targetVecNorm = new THREE.Vector3().subVectors(targetVec, player.position).normalize();
    //       // action.idle.stop()
    //       // action.run.play()
    //       // this.playerAnimationsState = "run"
    //   }
    // }
  }

  directionOffset(keysPressed) {
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
  }
  onMouseDblclick(event) {

      event.preventDefault();

      let rayCaster = new THREE.Raycaster();

      let mouse = new THREE.Vector2();

      let canvas = container;

      let getBoundingClientRect = canvas.getBoundingClientRect();

      let x = ((event.clientX - getBoundingClientRect.left) / canvas.offsetWidth) * 2 - 1;// 标准设备横坐标

      let y = -((event.clientY - getBoundingClientRect.top) / canvas.offsetHeight) * 2 + 1;// 标准设备纵坐标

      let standardVector = new THREE.Vector3(x, y, 1);

      let worldVector = standardVector.unproject(this.camera);

      let ray = worldVector.sub(this.camera.position).normalize();

      rayCaster = new THREE.Raycaster(this.camera.position, ray);

      let intersects = rayCaster.intersectObjects([this.scene.getObjectByName("Plane")], true);
      // let intersects = rayCaster.intersectObjects(this.scene.children, true);
      rayCaster.setFromCamera( mouse, this.camera );

      // let intersectsObj = rayCaster.intersectObject( scene, true );
     
      if (intersects.length > 0) {
          if (intersects[0].object.name == "Plane") {
              let targetVec = intersects[0].point
              let targetPositon = new THREE.Vector3(intersects[0].x, 0, intersects[0].z);
              distVec = targetVec.distanceTo(player.position);
              if (tween) {
                TWEEN.remove(tween);
              }
              player.lookAt(targetVec.x, 0, targetVec.y)
          }
      }
  }
  // 创建
  createCameras() {
      let childNode = new THREE.Object3D()
      let playerNode = childNode.clone()
      childNode.name = "childNode"
      playerNode.name = "playerNode"
      player.add(playerNode)
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

   //鼠标右键控制旋转相机
  thirdPersonCameraControl(moveX = 0, moveZ = 0) {
    // console.log("===")

    let playerNode = this.scene.getObjectByName("playerNode")
    if (playerNode) {
      let positonCopy = playerNode.getWorldPosition(new THREE.Vector3())
      // this.camera.position.x += moveX
      // this.camera.position.z += moveZ
      this.camera.position.x = positonCopy.x + this.radius * Math.sin(this.theta * Math.PI / 180) * Math.cos(this.phi * Math.PI / 180);
      this.camera.position.y = positonCopy.y + this.radius * Math.sin(this.phi * Math.PI / 180);
      this.camera.position.z = positonCopy.z + this.radius * Math.cos(this.theta * Math.PI / 180) * Math.cos(this.phi * Math.PI / 180);
      this.camera.updateMatrix();
      this.camera.lookAt(positonCopy);
    }
  }

  //角色移动
  roleClickMove() {
    if (distVec > 0) {
      distVec -= 0.08;
      // player.lookAt(ball.x, 0, ball.z)
      // player.translateOnAxis(targetVecNorm, 0.07);

      // player.rotation.z = 0
    }
    if (distVec == 0 || distVec < 0) {
      // action.run.stop()
      // action.idle.play()
      // this.playerAnimationsState = 'idle'
    }
  }

  //相机旋转
  roleRotation() {
    let actor = this.scene.getObjectByName("Unity2glTF_root")
    let playerNode = this.scene.getObjectByName('playerNode')
    //旋转
    // if (distVec > 0.05) {
      // actor.lookAt(ball.x, 0, ball.z)
    //   let playerNodeClone = playerNode.quaternion.clone()
    //   actor.quaternion.slerp(playerNodeClone, 0.1)
    // }
  }

  selectController(delta) {
    switch (this.stateInt) {
      case 0:
        //点击地面移动
        this.thirdPersonCameraControl()
        this.roleClickMove()
        this.roleRotation()
        break
      default:
    }
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

  // 创建传送点
  

  update=()=> {
    const delta = clock.getDelta();
    const directionPressed = DIRECTIONS.some(key => this.keysPressed[key] == true)
      // console.log("directionPressed", directionPressed)
    var play = '';
    if (directionPressed) {
        play = 'Run'
    } else {
        play = 'Idle'
    }

    if (this.currentAction == 'Run' || this.currentAction == 'Walk') {
      // console.log('player.position.x', player.position.x)
      // 摄像机方向计算
      var angleYCameraDirection = Math.atan2(
              (this.camera.position.x - player.position.x), 
              (this.camera.position.z - player.position.z))
      // 对角线移动角度偏移
      var directionOffset = this.directionOffset(this.keysPressed)

      // rotate model
      this.rotateQuarternion.setFromAxisAngle(this.rotateAngle, angleYCameraDirection + directionOffset)
      player.quaternion.rotateTowards(this.rotateQuarternion, 0.2)

      // calculate direction
      this.camera.getWorldDirection(this.walkDirection)
      this.walkDirection.y = 0
      this.walkDirection.normalize()
      this.walkDirection.applyAxisAngle(this.rotateAngle, directionOffset)

      // run/walk velocity
      const velocity = this.currentAction == 'Run' ? this.runVelocity : this.walkVelocity

      // move model & camera
      const moveX = this.walkDirection.x * velocity * delta
      const moveZ = this.walkDirection.z * velocity * delta
      // this.model.position.x += moveX
      // this.model.position.z += moveZ
      // this.thirdPersonCameraControl(moveX, moveZ)
      // this.updateCameraTarget(moveX, moveZ)
  }
    // labelRenderer.render( this.scene, this.camera );
    //动画
    if (mixers) {
      for (const mixer of mixers) mixer.update(delta);
    }
    this.selectController(delta)
    let playerNode = this.scene.getObjectByName('playerNode')
    let obj = {
      playerPosition: player.position,
      playerQuaternion: playerNode.quaternion,
      state: this.playerAnimationsState,
      id: this.player.scene.name,
    }
    this.socket.emit('message', obj);
  }
}
