import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import CameraControls from "camera-controls";
import type Mii from "../external/mii-js/mii";
import { MiiFavoriteColorLookupTable } from "../constants/ColorTables";

export enum CameraPosition {
  MiiHead,
  MiiFullBody,
}

export class Mii3DScene {
  #camera: THREE.PerspectiveCamera;
  #controls: CameraControls;
  #loader: GLTFLoader;
  #scene: THREE.Scene;
  #renderer: THREE.WebGLRenderer;
  #parent: HTMLElement;
  mii: Mii;
  ready: boolean;
  headReady: boolean;
  mixer!: THREE.AnimationMixer;
  animators: Map<string, (n: number, f: number) => any>;
  animations: Map<string, THREE.AnimationClip>;
  constructor(mii: Mii, parent: HTMLElement) {
    this.animations = new Map();
    this.animators = new Map();
    this.#parent = parent;
    this.#scene = new THREE.Scene();
    this.#camera = new THREE.PerspectiveCamera(
      45,
      parent.offsetWidth / parent.offsetHeight,
      0.1,
      1000
    );
    this.#camera.position.set(0, 0, 25);
    this.#camera.rotation.set(0, Math.PI, 0);
    this.ready = false;
    this.headReady = false;

    const cubeTextureLoader = new THREE.CubeTextureLoader();
    cubeTextureLoader
      .loadAsync([
        "./cube_map.png", // px.png
        "./cube_map.png", // nx.png
        "./cube_map.png", // py.png
        "./cube_map.png", // ny.png
        "./cube_map.png", // pz.png
        "./cube_map.png", // nz.png
      ])
      .then((environmentMap) => {
        this.#scene.environment = environmentMap;
        this.#scene.environmentIntensity = 1;
      });
    // cubeTextureLoader
    //   .loadAsync([
    //     "./assets/img/sky_px.png", // px.png
    //     "./assets/img/sky_nx.png", // nx.png
    //     "./assets/img/sky_py.png", // py.png
    //     "./assets/img/sky_ny.png", // ny.png
    //     "./assets/img/sky_pz.png", // pz.png
    //     "./assets/img/sky_nz.png", // nz.png
    //   ])
    //   .then((backgroundMap) => {
    //     this.#scene.background = backgroundMap;
    //     this.#scene.backgroundIntensity = 0.2;
    //   });

    const directionalLight = new THREE.DirectionalLight(0xebfeff, Math.PI);
    directionalLight.position.set(1, 0.1, 1);
    // directionalLight.visible = false;
    this.#scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0x666666, Math.PI / 16);
    // ambientLight.visible = false;
    this.#scene.add(ambientLight);

    this.#renderer = new THREE.WebGLRenderer({ antialias: true });
    this.#renderer.setSize(512, 512);
    // this.#renderer.setPixelRatio(window.devicePixelRatio * 0.1);

    CameraControls.install({ THREE });

    this.#controls = new CameraControls(
      this.#camera,
      this.#renderer.domElement
    );
    this.#controls.mouseButtons.left = CameraControls.ACTION.ROTATE;
    this.#controls.mouseButtons.right = CameraControls.ACTION.NONE;
    this.#controls.mouseButtons.wheel = CameraControls.ACTION.DOLLY;
    this.#controls.minDistance = 8;
    this.#controls.maxDistance = 35;
    this.#controls.minAzimuthAngle = -Math.PI;
    this.#controls.maxAzimuthAngle = Math.PI;

    // this.#controls.maxTargetRadius = 10;
    // this.#controls.enableDamping = true;
    // this.#controls.enablePan = false;
    // this.#controls.enableZoom = false;

    this.animators.set("cameraControls", (time, delta) => {
      this.#controls.update(delta);
    });

    this.#loader = new GLTFLoader();

    this.mii = mii;

    const clock = new THREE.Clock();

    const animate = (time: number) => {
      const delta = clock.getDelta();

      this.#renderer.render(this.#scene, this.#camera);
      this.animators.forEach((f) => f(time, delta));
      // const timeChange = time % 4;

      // TODO: nice background :D
      // this.#scene.backgroundRotation.set(
      //   0,
      //   (time / 1000) * 0.01 * Math.PI,
      //   (time / 1000) * 0.01 * Math.PI
      // );

      // if (this.mixer) {
      //   this.mixer.update(time * 1000);
      // }
    };

    this.#renderer.setClearAlpha(0);
    this.#renderer.setAnimationLoop(animate);

    this.#camera.aspect = this.#parent.offsetWidth / this.#parent.offsetHeight;
    this.#camera.updateProjectionMatrix();
    this.#renderer.setSize(this.#parent.offsetWidth, this.#parent.offsetHeight);
  }
  currentPosition!: CameraPosition;
  focusCamera(part: CameraPosition) {
    this.#controls.smoothTime = 0.2;

    // don't re-position the camera if it is already in the correct location
    if (this.currentPosition === part) return;

    this.currentPosition = part;

    if (part === CameraPosition.MiiFullBody) {
      this.#controls.moveTo(0, 0, 0, true);
      this.#controls.rotateTo(0, Math.PI / 2, true);
      this.#controls.dollyTo(25, true);
    } else if (part === CameraPosition.MiiHead) {
      this.#controls.moveTo(0, 3.5, 0, true);
      this.#controls.rotateTo(0, Math.PI / 2, true);
      this.#controls.dollyTo(15, true);
    }
  }
  resize() {
    this.#camera.aspect = this.#parent.offsetWidth / this.#parent.offsetHeight;
    this.#camera.updateProjectionMatrix();
    this.#renderer.setSize(this.#parent.offsetWidth, this.#parent.offsetHeight);
  }
  async init() {
    if (this.ready) return;
    this.ready = false;
    this.getRendererElement().style.opacity = "0";
    await this.#addBody();
    await this.updateMiiHead();
    this.ready = true;
  }
  getRendererElement() {
    return this.#renderer.domElement;
  }
  #playAnimation(mesh: THREE.Object3D, id: string, clip: THREE.AnimationClip) {
    // Create an AnimationMixer, and get the list of AnimationClip instances
    const mixer = new THREE.AnimationMixer(mesh);

    this.animators.set(id, (time, delta) => {
      mixer.update(delta);
    });

    const action = mixer.clipAction(clip);
    action.play();
  }
  async #addBody() {
    const setupMiiHeadAnim = async () => {
      const glb = await this.#loader.loadAsync("./miiHeadAnim.glb");
      this.animations.set("HeadBob", glb.animations[0]);
    };
    const setupMiiBody = async (path: string, type: "m" | "f") => {
      const glb = await this.#loader.loadAsync(path);

      console.log(glb);

      const clips = glb.animations;
      const floatClip = clips.find((c) => c.name === "Float")!;
      console.log("clip:", floatClip);

      this.#playAnimation(
        glb.scene.getObjectByName(type)!,
        path + type,
        floatClip
      );

      glb.scene.name = `${type}-body-root`;

      setTimeout(() => {
        this.#scene.add(glb.scene);
      });

      // Add materials to body and legs
      (glb.scene.getObjectByName(`body_${type}`)! as THREE.Mesh).material =
        new THREE.MeshStandardMaterial({ color: 0xffffff });
      (glb.scene.getObjectByName(`legs_${type}`)! as THREE.Mesh).material =
        new THREE.MeshStandardMaterial({ color: 0x666666 });

      if (this.#scene.getObjectByName("m"))
        this.#scene.getObjectByName("m")!.visible = false;
      if (this.#scene.getObjectByName("f"))
        this.#scene.getObjectByName("f")!.visible = false;
    };

    const loaders = [
      setupMiiBody("./miiBodyM.glb", "m"),
      setupMiiBody("./miiBodyF.glb", "f"),
      setupMiiHeadAnim(),
    ];

    await Promise.all(loaders);

    console.log("READY");
  }
  // getPantsColor() {
  //   if (this.mii.normalMii === false) {
  //     return 0xffff66;
  //   }
  //   if (this.mii.favorite) {
  //     return 0xff6666;
  //   }
  //   return 0x666666;
  // }
  async updateBody() {
    if (!this.ready) return;

    // console.log("updateBody");

    const bodyM = this.#scene.getObjectByName("m-body-root");
    const bodyF = this.#scene.getObjectByName("f-body-root");
    if (!bodyM) return;
    if (!bodyF) return;

    // console.log("h", this.mii.height, "w", this.mii.build);

    // // Arbitrary guesses at calculations..
    // const height = (this.mii.height / 127) * 1.5 + 0.25;
    // const build = (this.mii.build / 127) * 1.5 + 0.4; // * (height * 0.5);

    const build = this.mii.build;
    const height = this.mii.height;

    // Ported from FFL-Testing
    let scaleFactors = { x: 0, y: 0, z: 0 };

    scaleFactors.y = height / 128.0;
    scaleFactors.x = scaleFactors.y * 0.3 + 0.6;
    scaleFactors.x =
      ((scaleFactors.y * 0.6 + 0.8 - scaleFactors.x) * build) / 128.0 +
      scaleFactors.x;

    scaleFactors.y = scaleFactors.y * 0.55 + 0.6;

    // the below are applied for both sets of factors
    scaleFactors.z = scaleFactors.x;
    // Ensure scaleFactors.y is clamped to a maximum of 1.0
    scaleFactors.y = Math.min(scaleFactors.y, 1.0);

    switch (this.mii.gender) {
      // m
      case 0:
        bodyM.getObjectByName("m")!.visible = true;
        bodyF.getObjectByName("f")!.visible = false;
        bodyM
          .getObjectByName("m")!
          .scale.set(scaleFactors.x, scaleFactors.y, scaleFactors.z);
        const mBody = bodyM
          .getObjectByName("m")!
          .getObjectByName("body_m")! as THREE.Mesh;
        (mBody.material as THREE.MeshStandardMaterial).color.set(
          MiiFavoriteColorLookupTable[this.mii.favoriteColor]
        );
        // const mLegs = bodyM
        //   .getObjectByName("m")!
        //   .getObjectByName("legs_m")! as THREE.Mesh;
        // (mLegs.material as THREE.MeshStandardMaterial).color.set(
        //   this.getPantsColor()
        // );
        break;
      // f
      case 1:
        bodyM.getObjectByName("m")!.visible = false;
        bodyF.getObjectByName("f")!.visible = true;
        bodyF
          .getObjectByName("f")!
          .scale.set(scaleFactors.x, scaleFactors.y, scaleFactors.z);
        const fBody = bodyF
          .getObjectByName("f")!
          .getObjectByName("body_f")! as THREE.Mesh;
        (fBody.material as THREE.MeshStandardMaterial).color.set(
          MiiFavoriteColorLookupTable[this.mii.favoriteColor]
        );

        // const fLegs = bodyF
        //   .getObjectByName("f")!
        //   .getObjectByName("legs_f")! as THREE.Mesh;
        // (fLegs.material as THREE.MeshStandardMaterial).color.set(
        //   this.getPantsColor()
        // );
        break;
    }
  }
  debugGetScene() {
    return this.#scene;
  }
  fadeIn() {
    this.getRendererElement().style.opacity = "1";
  }
  async updateMiiHead() {
    if (!this.ready) {
      console.log("first time loading head");
      // return;
    }
    let head = this.#scene.getObjectsByProperty("name", "MiiHead");

    const GLB = await this.#loader.loadAsync(
      this.mii.studioUrl({
        ext: "glb",
      } as unknown as any)
    );

    if (head.length > 0) {
      // console.log("attempting to remove head", head);
      this.#scene.remove(...head);
    }

    GLB.scene.name = "MiiHead";
    GLB.scene.scale.set(0.12, 0.12, 0.12);
    this.#scene.add(GLB.scene);

    // use head bob animation from animations source
    const clip = this.animations.get("HeadBob")!;

    this.#playAnimation(GLB.scene, "MiiHeadBobClip", clip);

    // hack to fix inverted Mii head..
    if (this.mii.flipHair) {
      (
        (GLB.scene.getObjectByName("mesh_3") as THREE.Mesh)
          .material as THREE.MeshBasicMaterial
      ).side = THREE.BackSide;
      (
        (GLB.scene.getObjectByName("mesh_2") as THREE.Mesh)
          .material as THREE.MeshBasicMaterial
      ).side = THREE.BackSide;
    }

    // GLB.scene.children.forEach((c) => {
    //   // (c as any).material.metalness = 0;
    //   // (c as any).material.roughness = 0.5;
    //   console.log(c);
    // });
    console.log(GLB);

    this.headReady = true;
    this.fadeIn();
    this.updateBody();
  }

  shutdown() {
    Array.from(this.animators.keys()).forEach((k) => {
      this.animators.delete(k);
    });
  }
}
