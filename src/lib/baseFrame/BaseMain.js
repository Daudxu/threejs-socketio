import BaseScene from './BaseScene'
import BaseCamera from './BaseCamera'
import BaseOrbitControls from './BaseOrbitControls'

import BaseRenderer from './BaseRenderer'


class BaseMain {
  // 静态回调方法
  static onInitSuccess = () => {};
  static onStart = () => {};
  static onStop = () => {};
  static onExit = () => {};
  static onLoop = () => {};

  constructor(container) {
    this.container = container
    this.baseScene = new BaseScene(container);
    this.render=new BaseRenderer(container)
    this.baseCamera = new BaseCamera(container,this.render);
    this.baseOrbitControls = new BaseOrbitControls(this.baseCamera.camera, this.render.renderer);

    this.screenAdaptationMonitoring()
  }
  screenAdaptationMonitoring(){
    let _this = this
    //屏幕适应监听
    window.addEventListener('click', function () {
      _this.onWindowResize()
    }, false)
    //屏幕适应监听
    window.addEventListener('resize', function () {
      _this.onWindowResize()
    }, false)

  }

  //屏幕自适应
  onWindowResize() {
    this.baseCamera.camera.aspect = this.container.clientWidth / this.container.clientHeight
    this.baseCamera.camera.updateProjectionMatrix()
    this.render.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.render.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2))
  }
}

export { BaseMain };
