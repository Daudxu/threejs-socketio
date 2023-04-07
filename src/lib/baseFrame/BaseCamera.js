import * as THREE from 'three';

export default class BaseCamera {
  constructor(container,renderer) {
    this.container=container
    this.renderer=renderer
    this.initCamera();
  }
  
  /**
   * 初始化相机
   */
  initCamera() {
    let _this = this
    _this.camera = new THREE.PerspectiveCamera(65, _this.container.clientWidth / _this.container.clientHeight, 0.1, 1000 );
    _this.camera.position.set(0, 5, 50)

  }

}
