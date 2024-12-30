import * as THREE from "three";
// make sure types work with the patched GLTF loader
import { type GLTFLoader as TrueGLTFLoader } from "three/addons/loaders/GLTFLoader.js";
// very hacky but it works to fix the shader bug...
import { GLTFLoader } from "./3d/Custom_GLTFLoader";
import CameraControls from "camera-controls";
import Mii from "../external/mii-js/mii";
import {
  MiiFavoriteColorLookupTable,
  MiiFavoriteColorVec4Table,
} from "../constants/ColorTables";
import {
  cMaterialName,
  cPantsColorGold,
  cPantsColorGray,
  cPantsColorRed,
  MiiFavoriteFFLColorLookupTable,
} from "./3d/shader/fflShaderConst";
import { RenderPart } from "./MiiEditor";
import { Config } from "../config";
import { getSoundManager } from "./audio/SoundManager";
import { SparkleParticle } from "./3d/effect/SparkleParticle";
import { multiplyTexture } from "./3d/canvas/multiplyTexture";
import { HatType, HatTypeList } from "../constants/Extensions";
import localforage from "localforage";
import { traverseAddShader, traverseMesh } from "./3d/shader/ShaderUtils";
import { RoomEnvironment } from "three/examples/jsm/Addons.js";
import { getSetting } from "../util/SettingsHelper";

export enum CameraPosition {
  MiiHead,
  MiiFullBody,
}
export enum SetupType {
  Normal,
  Screenshot,
}

export class Mii3DScene {
  #camera: THREE.PerspectiveCamera;
  #controls: CameraControls;
  #textureLoader: THREE.TextureLoader;
  #gltfLoader: TrueGLTFLoader;
  #scene: THREE.Scene;
  #renderer: THREE.WebGLRenderer;
  #parent: HTMLElement;
  mii: Mii;
  ready: boolean;
  headReady: boolean;
  mixer!: THREE.AnimationMixer;
  animators: Map<string, (n: number, f: number) => any>;
  animations: Map<string, THREE.AnimationClip>;
  setupType: SetupType;
  #initCallback?: (renderer: THREE.WebGLRenderer) => any;
  type: "m" | "f";
  cameraPan!: boolean;
  shaderOverride: boolean;

  constructor(
    mii: Mii,
    parent: HTMLElement,
    setupType: SetupType = SetupType.Normal,
    initCallback?: (renderer: THREE.WebGLRenderer) => any,
    // shaderOverride uses MeshStandardMaterial
    shaderOverride: boolean = false
  ) {
    this.animations = new Map();
    this.animators = new Map();
    this.anim = new Map();
    this.#parent = parent;
    this.#scene = new THREE.Scene();
    this.#camera = new THREE.PerspectiveCamera(
      45,
      parent.offsetWidth / parent.offsetHeight,
      0.1,
      1000
    );
    this.ready = false;
    this.headReady = false;
    if (initCallback) this.#initCallback = initCallback;
    this.shaderOverride = shaderOverride;

    if (setupType === SetupType.Screenshot) {
      this.#renderer = new THREE.WebGLRenderer({
        antialias: true,
        preserveDrawingBuffer: true,
      });
    } else {
      this.#renderer = new THREE.WebGLRenderer({ antialias: true });
    }
    this.getRendererElement().classList.add("scene");
    this.setupType = setupType;

    getSetting("shaderType").then((type) => {
      if (type === "none") {
        // hack for some lighting
        const pmremGen = new THREE.PMREMGenerator(this.#renderer);
        const roomEnv = pmremGen.fromScene(new RoomEnvironment()).texture;
        this.#scene.environment = roomEnv;
        this.#scene.environmentIntensity = 0.6;
      } else if (type !== "lightDisabled") {
        this.#scene.environmentIntensity = 0;
      }

      // hack to make the camera focus correctly
      this.focusCamera(CameraPosition.MiiHead, true);
    });

    this.#renderer.setSize(512, 512);
    // this.#renderer.setPixelRatio(window.devicePixelRatio * 0.1);

    CameraControls.install({ THREE });

    this.#controls = new CameraControls(
      this.#camera,
      this.#renderer.domElement
    );
    if (setupType === SetupType.Normal) {
      const camSetup = async () => {
        const canPan = await localforage.getItem("settings_cameraPan");

        if (canPan !== true) {
          console.log("canPan is not false:", canPan);
          this.#controls.mouseButtons.left = CameraControls.ACTION.ROTATE;
          this.#controls.mouseButtons.right = CameraControls.ACTION.NONE;
          this.#controls.mouseButtons.wheel = CameraControls.ACTION.DOLLY;
          this.#controls.touches.one = CameraControls.ACTION.TOUCH_ROTATE;
          this.#controls.touches.two = CameraControls.ACTION.TOUCH_DOLLY;
          this.#controls.touches.three = CameraControls.ACTION.NONE;
          this.#controls.minDistance = 8;
          this.#controls.maxDistance = 35;
          // this.#controls.minDistance = 60;
          // this.#controls.maxDistance = 100;
          this.#controls.minAzimuthAngle = -Math.PI;
          this.#controls.maxAzimuthAngle = Math.PI;
          this.cameraPan = true;
        } else {
          this.#camera.fov = 15;
          this.#camera.updateProjectionMatrix();
          this.#controls.mouseButtons.left = CameraControls.ACTION.NONE;
          this.#controls.mouseButtons.right = CameraControls.ACTION.NONE;
          this.#controls.mouseButtons.wheel = CameraControls.ACTION.NONE;
          this.#controls.touches.one = CameraControls.ACTION.NONE;
          this.#controls.touches.two = CameraControls.ACTION.NONE;
          this.#controls.touches.three = CameraControls.ACTION.NONE;
          this.#controls.minDistance = 60;
          this.#controls.maxDistance = 140;
          this.#controls.minAzimuthAngle = -Math.PI;
          this.#controls.maxAzimuthAngle = Math.PI;
          this.#controls.dollyTo(100);
          this.cameraPan = false;
        }
      };
      camSetup();
    }

    if (setupType === SetupType.Screenshot) {
      // this.#controls.moveTo(0, 1.5, 0);
      this.#controls.dollyTo(40);
      this.#camera.fov = 30;

      // prevent too much zoom lol
      this.#controls.minDistance = 8;
      this.#controls.maxDistance = 300;
    } else {
      setTimeout(() => {
        this.focusCamera(CameraPosition.MiiHead, true);
      }, 200);
    }

    // this.#controls.maxTargetRadius = 10;
    // this.#controls.enableDamping = true;
    // this.#controls.enablePan = false;
    // this.#controls.enableZoom = false;

    this.animators.set("cameraControls", (time, delta) => {
      this.#controls.update(delta);
    });

    this.#textureLoader = new THREE.TextureLoader();
    this.#gltfLoader = new GLTFLoader() as TrueGLTFLoader;

    this.mii = mii;

    this.type = this.mii.gender === 0 ? "m" : "f";

    const clock = new THREE.Clock();

    const animate = (time: number) => {
      const delta = clock.getDelta();

      this.#renderer.render(this.#scene, this.#camera);
      this.animators.forEach((f) => f(time, delta));
    };

    this.#renderer.setClearAlpha(0);
    this.#renderer.setAnimationLoop(animate);

    this.#camera.aspect = this.#parent.offsetWidth / this.#parent.offsetHeight;
    this.#camera.updateProjectionMatrix();
    this.#renderer.setSize(this.#parent.offsetWidth, this.#parent.offsetHeight);
  }
  currentPosition!: CameraPosition;
  focusCamera(
    part: CameraPosition,
    force: boolean = false,
    transition: boolean = true
  ) {
    this.#controls.smoothTime = 0.2;

    // don't re-position the camera if it is already in the correct location
    if (this.currentPosition === part && force === false) return;

    this.currentPosition = part;

    const pos = new THREE.Vector3();
    let body = this.#scene.getObjectByName(this.type)!,
      head = this.#scene.getObjectByName("MiiHead");
    // if (body !== undefined) {
    //   head = body.getObjectByName("head")! as THREE.Bone;
    // }

    if (part === CameraPosition.MiiFullBody) {
      pos.y = 10;
      this.#controls.moveTo(pos.x, pos.y, pos.z, transition);
      this.#controls.rotateTo(0, Math.PI / 2, transition);
      this.#controls.dollyTo(35, transition);
      if (this.cameraPan === false) {
        this.#controls.dollyTo(120, transition);
      }
    } else if (part === CameraPosition.MiiHead) {
      if (body !== undefined) {
        const box = new THREE.Box3().setFromObject(body);
        pos.y = box.max.y - box.min.y;
      }
      this.#controls.moveTo(pos.x, pos.y + 2, pos.z, transition);
      this.#controls.rotateTo(0, Math.PI / 2, transition);
      this.#controls.dollyTo(25, transition);
      if (this.cameraPan === false) {
        this.#controls.dollyTo(100, transition);
      }
    }
  }
  playEndingAnimation() {
    this.focusCamera(CameraPosition.MiiFullBody, true);
    let heads = this.#scene.getObjectsByProperty("name", "MiiHead");
    for (const head of heads) {
      this.traverseAddFaceMaterial(
        head as THREE.Mesh,
        `&data=${encodeURIComponent(
          this.mii.encodeStudio().toString("hex")
        )}&expression=1&width=512`
      );
    }
    const type = this.mii.gender == 0 ? "m" : "f";
    this.animators.delete(`animation-${type}`);
    this.swapAnimation("Finish");
    getSoundManager().playSound("finish");
  }
  resize(
    width: number = this.#parent.offsetWidth,
    height: number = this.#parent.offsetHeight
  ) {
    this.#camera.aspect = width / height;
    this.#camera.updateProjectionMatrix();
    this.#renderer.setSize(width, height);
  }
  async init() {
    if (this.ready) return;
    this.ready = false;
    this.getRendererElement().style.opacity = "0";
    await this.#addBody();
    this.swapAnimation("Wait", true);
    await this.updateMiiHead();
    this.ready = true;
    if (this.setupType === SetupType.Screenshot) {
      this.#initCallback && this.#initCallback(this.#renderer);
    } else {
      // weird hacky fix to correct the camera position at startup
      setTimeout(() => {
        this.focusCamera(CameraPosition.MiiHead, true, false);
      }, 500);
    }
  }
  getRendererElement() {
    return this.#renderer.domElement;
  }
  anim!: Map<"m" | "f", THREE.AnimationAction>;
  currentAnim!: string;
  initAnimation(mesh: THREE.Object3D, id: string) {
    console.debug("playAnimation() called:", mesh, id);

    // weird hack to prevent random crash
    if (this.mixer === undefined)
      this.mixer = new THREE.AnimationMixer(this.#scene.getObjectByName("m")!);

    this.animators.set(id, (_time, delta) => {
      try {
        this.mixer.update(delta);
      } catch (e) {
        console.warn(e);
      }
    });
  }
  swapAnimation(newAnim: string, force: boolean = false) {
    console.debug("swapAnimation() called:", newAnim);
    if (newAnim === this.currentAnim) return;
    if (force !== true) {
      for (const [_, anim] of this.anim) {
        anim.fadeOut(0.2);
      }
    } else {
      for (const [_, anim] of this.anim) {
        anim.fadeOut(0).reset().stop();
      }
    }
    this.currentAnim = newAnim;
    let x: ("m" | "f")[] = ["m", "f"];
    for (const key of x) {
      this.anim.set(
        key,
        this.mixer.clipAction(
          this.animations.get(`${key}-${newAnim}`)!,
          this.#scene.getObjectByName(key)
        )
      );
      this.anim
        .get(key)!
        .reset()
        .setEffectiveTimeScale(1)
        .setEffectiveWeight(1);

      // hack to prevent anim from being sped up
      if (newAnim === "Wait") {
        setTimeout(() => {
          this.anim.get(key)!.timeScale = 0.5;
        }, 33.33);
      }

      if (force === false) {
        this.anim.get(key)!.fadeIn(0.2).play();
      } else {
        this.anim.get(key)!.play();
      }

      this.anim.get(key)!.timeScale = 1;
    }
  }
  async #addBody() {
    const setupMiiBody = async (path: string, type: "m" | "f") => {
      const glb = await this.#gltfLoader.loadAsync(path);

      const clips = glb.animations;

      this.mixer = new THREE.AnimationMixer(glb.scene.getObjectByName(type)!);
      for (const anim of clips) {
        this.animations.set(`${type}-${anim.name}`, anim);
      }

      glb.scene.name = `${type}-body-root`;

      // RAF WAS HERE
      this.#scene.add(glb.scene);

      // attempt to solve weird animations not working issue
      this.initAnimation(glb.scene.getObjectByName(type)!, `animation-${type}`);

      // Add materials to body and legs
      const gBodyMesh = glb.scene.getObjectByName(
        `body_${type}`
      )! as THREE.Mesh;
      gBodyMesh.geometry.userData = {
        cullMode: 1,
        modulateColor: MiiFavoriteFFLColorLookupTable[this.mii.favoriteColor],
        modulateMode: 0,
        modulateType: cMaterialName.FFL_MODULATE_TYPE_SHAPE_BODY,
      };
      if (this.shaderOverride)
        // Override material with a MeshStandardMaterial
        gBodyMesh.material = new THREE.MeshStandardMaterial({
          roughness: 1,
          metalness: 1,
          color: MiiFavoriteColorLookupTable[this.mii.favoriteColor],
        });
      // adds shader material
      else traverseMesh(gBodyMesh, this.mii);

      const gLegsMesh = glb.scene.getObjectByName(
        `legs_${type}`
      )! as THREE.Mesh;
      gLegsMesh.geometry.userData = {
        cullMode: 1,
        modulateColor: cPantsColorGray,
        modulateMode: 0,
        modulateType: cMaterialName.FFL_MODULATE_TYPE_SHAPE_PANTS,
      };
      if (this.shaderOverride)
        gLegsMesh.material = new THREE.MeshStandardMaterial({
          metalness: 1,
          roughness: 1,
          color: new THREE.Color(
            this.getPantsColor()[0],
            this.getPantsColor()[1],
            this.getPantsColor()[2]
          ),
        });
      // adds shader material
      else traverseMesh(gLegsMesh, this.mii);

      if (this.#scene.getObjectByName("m"))
        this.#scene.getObjectByName("m")!.visible = false;
      if (this.#scene.getObjectByName("f"))
        this.#scene.getObjectByName("f")!.visible = false;

      glb.scene.rotation.set(0, 0, 0);
    };

    const bodyModel = (await getSetting("bodyModel")) as string;

    const loaders = [
      setupMiiBody(`./assets/mdl/miiBodyM_${bodyModel}.glb`, "m"),
      setupMiiBody(`./assets/mdl/miiBodyF_${bodyModel}.glb`, "f"),
    ];

    await Promise.all(loaders);

    console.log("READY");
  }
  getPantsColor() {
    if (this.mii.normalMii === false) {
      return cPantsColorGold;
    }
    if (this.mii.favorite) {
      return cPantsColorRed;
    }
    return cPantsColorGray;
  }
  async updateBody() {
    if (!this.ready) return;

    this.type = this.mii.gender === 0 ? "m" : "f";

    const bodyM = this.#scene.getObjectByName("m-body-root");
    const bodyF = this.#scene.getObjectByName("f-body-root");
    if (!bodyM) return;
    if (!bodyF) return;

    const build = this.mii.build;
    const height = this.mii.height;

    // Ported from FFL-Testing
    let scaleFactors = { x: 0, y: 0, z: 0 };

    switch (Config.mii.scalingMode) {
      case "old":
        scaleFactors.y = height / 128.0;
        scaleFactors.x = scaleFactors.y * 0.3 + 0.6;
        scaleFactors.x =
          ((scaleFactors.y * 0.6 + 0.8 - scaleFactors.x) * build) / 128.0 +
          scaleFactors.x;

        scaleFactors.y = scaleFactors.y * 0.55 + 0.6;

        // Ensure scaleFactors.y is clamped to a maximum of 1.0
        scaleFactors.y = Math.min(scaleFactors.y, 1.0);
        break;
      case "new":
        // NOTE: even in wii u mii maker this still shows a few
        // pixels of the pants, but here without proper body scaling
        // this won't actually let you get away w/o pants
        let heightFactor = height / 128.0;
        scaleFactors.y = heightFactor * 0.55 + 0.6;
        scaleFactors.x = heightFactor * 0.3 + 0.6;
        scaleFactors.x =
          (heightFactor * 0.6 + 0.8 - scaleFactors.x) * (build / 128.0) +
          scaleFactors.x;
        break;
      case "newest":
        // 0.47 / 128.0 = 0.003671875
        scaleFactors.x =
          (build * (height * 0.003671875 + 0.4)) / 128.0 +
          // 0.23 / 128.0 = 0.001796875
          height * 0.001796875 +
          0.4;
        // 0.77 / 128.0 = 0.006015625
        scaleFactors.y = height * 0.006015625 + 0.5;
        break;
    }

    scaleFactors.z = scaleFactors.x;

    // @ts-expect-error debug
    window.scaleFactors = scaleFactors;

    const traverseBones = (object: THREE.Object3D) => {
      object.scale.set(scaleFactors.x, scaleFactors.y, scaleFactors.z);

      // this.#scene
      //   .getObjectByName("MiiHead")!
      //   .scale.set(
      //     0.12 / scaleFactors.x,
      //     0.12 / scaleFactors.y,
      //     0.12 / scaleFactors.z
      //   );
      // object.traverse((o: THREE.Object3D) => {
      //   if ((o as THREE.Bone).isBone) {
      //     // attempt at porting some bone scaling code.. disabled for now
      //     const bone = o as THREE.Bone;
      //     if (bone.name === "head") return;
      //     let boneScale = { x: 1, y: 1, z: 1 };
      //     switch (bone.name) {
      //       case "skl_root":
      //         break;
      //       case "chest":
      //       case "hip":
      //       case "foot_l1":
      //       case "foot_l2":
      //       case "foot_r1":
      //       case "foot_r2":
      //         boneScale.x = scaleFactors.x;
      //         boneScale.y = scaleFactors.y;
      //         boneScale.z = scaleFactors.z;
      //         break;
      //       case "arm_l1":
      //       case "arm_l2":
      //       case "arm_r1":
      //       case "arm_lr2":
      //         boneScale.x = scaleFactors.y;
      //         boneScale.y = scaleFactors.x;
      //         boneScale.z = scaleFactors.z;
      //         break;
      //       case "wrist_l":
      //       case "wrist_r":
      //       case "ankle_l":
      //       case "ankle_r":
      //         boneScale.x = scaleFactors.x;
      //         boneScale.y = scaleFactors.x;
      //         boneScale.z = scaleFactors.x;
      //         break;
      //       default:
      //         break;
      //       // case "chest":
      //       // case "chest_2":
      //       // case "hip":
      //       // case "foot_l1":
      //       // case "foot_l2":
      //       // case "foot_r1":
      //       // case "foot_r2":
      //       //   boneScale.x = scaleFactors.x;
      //       //   boneScale.y = scaleFactors.y;
      //       //   boneScale.z = scaleFactors.z;
      //       //   break;
      //       // case "arm_l1":
      //       // case "arm_l2":
      //       // case "elbow_l":
      //       // case "arm_r1":
      //       // case "arm_r2":
      //       // case "elbow_r":
      //       //   boneScale.x = scaleFactors.y;
      //       //   boneScale.y = scaleFactors.x;
      //       //   boneScale.z = scaleFactors.z;
      //       //   break;
      //       // case "wrist_l":
      //       // case "shoulder_l":
      //       // case "wrist_r":
      //       // case "shoulder_r":
      //       // case "ankle_l":
      //       // case "knee_l":
      //       // case "ankle_r":
      //       // case "knee_r":
      //       //   boneScale.x = scaleFactors.x;
      //       //   boneScale.y = scaleFactors.x;
      //       //   boneScale.z = scaleFactors.x;
      //       //   break;
      //       // case "head":
      //       //   boneScale.x = scaleFactors.x;
      //       //   boneScale.y = Math.min(scaleFactors.y, 1.0);
      //       //   boneScale.z = scaleFactors.z;
      //       //   break;
      //     }
      //     bone.scale.set(boneScale.x, boneScale.y, boneScale.z);
      //   }
      // });
    };

    const makeHeadBoneUpdate = (body: THREE.Object3D) => {
      const quaternion = new THREE.Quaternion();
      const scale = new THREE.Vector3();
      return () => {
        const headBone = body.getObjectByName("head") as THREE.Bone;
        if (!headBone) return;
        headBone.updateMatrixWorld(true);

        // Extract the position and rotation from the matrix
        const position = new THREE.Vector3();

        headBone.matrixWorld.decompose(position, quaternion, scale);
        if (this.#scene.getObjectByName("MiiHead")!) {
          // Set the head model's position and rotation
          this.#scene.getObjectByName("MiiHead")!.position.copy(position);
          this.#scene
            .getObjectByName("MiiHead")!
            .setRotationFromQuaternion(quaternion);
          // this.#scene.getObjectByName("MiiHead")!.rotation.x -= Math.PI / 2;
        }
      };
    };

    const shaderSetting = await getSetting("shaderType");

    switch (this.mii.gender) {
      // m
      case 0:
        bodyM.getObjectByName("m")!.visible = true;
        bodyF.getObjectByName("f")!.visible = false;

        // Attach head to head bone of body (not physically this time)
        this.animators.set("head_bone", makeHeadBoneUpdate(bodyM));

        // Scale each bone except for body
        traverseBones(bodyM);

        // ONLY KEEP BELOW IF USING SHADER MATERIAL, it will error if material is changed

        const mBody = bodyM
          .getObjectByName("m")!
          .getObjectByName("body_m")! as THREE.Mesh;
        if (shaderSetting === "wiiu" && this.shaderOverride === false)
          (mBody.material as THREE.ShaderMaterial).uniforms.u_const1.value =
            new THREE.Vector4(
              ...MiiFavoriteFFLColorLookupTable[this.mii.favoriteColor]
            );
        const mLegs = bodyM
          .getObjectByName("m")!
          .getObjectByName("legs_m")! as THREE.Mesh;
        if (shaderSetting === "wiiu" && this.shaderOverride === false)
          (mLegs.material as THREE.ShaderMaterial).uniforms.u_const1.value =
            new THREE.Vector4(...this.getPantsColor());

        if (shaderSetting === "none" || this.shaderOverride) {
          (mBody.material as THREE.MeshBasicMaterial).color.set(
            MiiFavoriteFFLColorLookupTable[this.mii.favoriteColor][0],
            MiiFavoriteFFLColorLookupTable[this.mii.favoriteColor][1],
            MiiFavoriteFFLColorLookupTable[this.mii.favoriteColor][2]
          );
          (mLegs.material as THREE.MeshBasicMaterial).color.set(
            this.getPantsColor()[0],
            this.getPantsColor()[1],
            this.getPantsColor()[2]
          );
        }
        break;
      // f
      case 1:
        bodyM.getObjectByName("m")!.visible = false;
        bodyF.getObjectByName("f")!.visible = true;

        // Attach head to head bone of body (not physically this time)
        this.animators.set("head_bone", makeHeadBoneUpdate(bodyF));

        // Scale each bone except for body
        traverseBones(bodyF);

        // KEEP BELOW IF USING SHADER MATERIAL, comment this section and uncomment the one below it to enable the one without shader material

        const fBody = bodyF
          .getObjectByName("f")!
          .getObjectByName("body_f")! as THREE.Mesh;
        if (shaderSetting === "wiiu" && this.shaderOverride === false)
          (fBody.material as THREE.ShaderMaterial).uniforms.u_const1.value =
            new THREE.Vector4(
              ...MiiFavoriteFFLColorLookupTable[this.mii.favoriteColor]
            );
        const fLegs = bodyF
          .getObjectByName("f")!
          .getObjectByName("legs_f")! as THREE.Mesh;
        if (shaderSetting === "wiiu" && this.shaderOverride === false)
          (fLegs.material as THREE.ShaderMaterial).uniforms.u_const1.value =
            new THREE.Vector4(...this.getPantsColor());

        if (shaderSetting === "none" || this.shaderOverride) {
          (fBody.material as THREE.MeshBasicMaterial).color.set(
            MiiFavoriteFFLColorLookupTable[this.mii.favoriteColor][0],
            MiiFavoriteFFLColorLookupTable[this.mii.favoriteColor][1],
            MiiFavoriteFFLColorLookupTable[this.mii.favoriteColor][2]
          );
          (fLegs.material as THREE.MeshBasicMaterial).color.set(
            this.getPantsColor()[0],
            this.getPantsColor()[1],
            this.getPantsColor()[2]
          );
        }
        break;
    }
  }
  debugGetScene() {
    return this.#scene;
  }
  fadeIn() {
    if (this.setupType === SetupType.Normal) {
      this.getRendererElement().style.opacity = "0";
      setTimeout(() => {
        this.getRendererElement().style.opacity = "1";
      }, 500);
    } else {
      // Screenshot mode only
      this.getRendererElement().style.opacity = "1";
    }
  }
  async updateMiiHead(renderPart: RenderPart = RenderPart.Head) {
    if (!this.ready) {
      console.log("first time loading head");
      // return;
    }
    let head = this.#scene.getObjectsByProperty("name", "MiiHead");

    switch (renderPart) {
      case RenderPart.Head:
        if (head.length > 0) {
          head.forEach((h) => {
            // Dispose of old head materials
            h.traverse((c) => {
              let child = c as THREE.Mesh;
              if (child.isMesh) {
                child.geometry.dispose();
                const mat = child.material as THREE.MeshBasicMaterial;
                if (mat.map) mat.map.dispose();
                mat.dispose();
              }
            });
          });
        }
        try {
          // CUSTOM APP-SPECIFIC DATA
          let favoriteColor: number = this.mii.favoriteColor;
          // console.log("fav color:", favoriteColor);

          const tmpMii = new Mii(this.mii.encode());
          if (this.mii.extHatColor !== 0) {
            tmpMii.favoriteColor = this.mii.extHatColor - 1;
          }
          let params: Record<string, string> = {};
          if (this.mii.extHatType !== 0) {
            // Custom hat model types
            switch (HatTypeList[this.mii.extHatType]) {
              case HatType.HAT:
                params["modelType"] = "hat";
                break;
              case HatType.FACE_ONLY:
                params["modelType"] = "face_only";
                break;
            }
          }
          const GLB = await this.#gltfLoader.loadAsync(
            tmpMii.studioUrl({
              ext: "glb",
              miiName: this.mii.miiName,
              creatorName: this.mii.creatorName,
              miic: encodeURIComponent(this.mii.encode().toString("base64")),
              ...params,
            } as unknown as any)
          );
          this.mii.favoriteColor = favoriteColor;

          GLB.scene.name = "MiiHead";
          // head is no longer attached to head bone physically, no more need to offset rotation
          // GLB.scene.rotation.set(-Math.PI / 2, 0, 0);
          GLB.scene.scale.set(0.12, 0.12, 0.12);

          try {
            if (this.mii.extHatType !== 0) {
              let hatModel = await this.#gltfLoader.loadAsync(
                `./assets/mdl/hat_${this.mii.extHatType}.glb`
              );

              hatModel.scene.name = "HatScene";
              let i = 0;
              hatModel.scene.traverse((o: any) => {
                // "HatRoot" would be the name of the parent object to the hat if it is an armature
                if (o.name === "HatScene" || o.name === "HatRoot") return;

                if ((o as THREE.Mesh).isMesh) {
                  let m = o as THREE.Mesh;
                  const mat = m.material as THREE.MeshStandardMaterial;
                  const tex = multiplyTexture(
                    mat.map!,
                    MiiFavoriteColorVec4Table[
                      this.mii.extHatColor !== 0
                        ? this.mii.extHatColor - 1
                        : this.mii.favoriteColor
                    ]
                  );
                  // VERY HACKY SET HAT TEXTURE
                  // setTimeout(() => {
                  // (
                  //   m.material as THREE.ShaderMaterial
                  // ).uniforms.s_texture.value = tex;
                  // }, 16.66);
                  m.material = new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    map: tex,
                  });
                  m.material.needsUpdate = true;
                  m.geometry.userData = {
                    // ignore: 1,
                    cullMode: 0,
                    modulateColor:
                      MiiFavoriteColorVec4Table[
                        this.mii.extHatColor !== 0
                          ? this.mii.extHatColor - 1
                          : this.mii.favoriteColor
                      ],
                    modulateMode: 5, //5,
                    modulateType: 5, //5,
                  };

                  i++;
                }
              });

              GLB.scene.add(hatModel.scene);
            }
          } catch (e) {
            console.error(
              "Hat type resulted in an error, but we're not going to let that stop the head from rendering!",
              e
            );
          }

          // enable shader on head
          this.#scene.remove(...head);
          // hack to force remove head anyways
          this.#scene.getObjectsByProperty("name", "MiiHead").forEach((obj) => {
            obj.parent!.remove(obj);
          });
          traverseAddShader(GLB.scene, this.mii);

          const headBone = this.#scene
            .getObjectByName(this.type)!
            .getObjectByName("head") as THREE.Bone;
          if (!headBone) return;
          headBone.updateMatrixWorld(true);

          // Extract the position and rotation from the matrix
          const position = new THREE.Vector3();
          const quaternion = new THREE.Quaternion();
          const scale = new THREE.Vector3();

          headBone.matrixWorld.decompose(position, quaternion, scale);
          if (GLB.scene) {
            // Set the head model's position and rotation
            GLB.scene.position.copy(position);
            GLB.scene.setRotationFromQuaternion(quaternion);
            // GLB.scene.rotation.x -= Math.PI / 2;
          }

          this.#scene.add(GLB.scene);
        } catch (e) {
          console.error(e);
        }
        break;
      case RenderPart.Face:
        if (head.length > 0) {
          head.forEach((h) => {
            this.traverseAddFaceMaterial(
              h as THREE.Mesh,
              `&data=${encodeURIComponent(
                this.mii.encodeStudio().toString("hex")
              )}&width=512`
            );
          });
        }
        break;
    }

    if (this.headReady === false) this.fadeIn();
    this.headReady = true;
    await this.updateBody();
  }
  sparkle() {
    // remove all previous sparkles lol
    this.animations
      .keys()
      .filter((p) => p.startsWith("particle_"))
      .forEach((key) => this.animations.delete(key));

    // Load the sparkle texture
    const loader = new THREE.TextureLoader();
    loader.load("./assets/img/star.png", (texture) => {
      // Create a sparkle effect at the center of the scene
      const pos = new THREE.Vector3();
      const box = new THREE.Box3();
      this.#scene.getObjectByName("MiiHead")!.getWorldPosition(pos);
      box.setFromObject(this.#scene.getObjectByName("MiiHead")!);
      let particle = new SparkleParticle(
        this.#scene,
        new THREE.Vector3(0, pos.y + box.min.y / 2, 2),
        texture
      );
      this.animators.set("particle_" + performance.now(), (_t, delta) =>
        particle.update(delta)
      );
      setTimeout(() => {
        this.animations
          .keys()
          .filter((p) => p.startsWith("particle_"))
          .forEach((key) => this.animations.delete(key));
      }, 1000);
    });
  }
  getHead() {
    return this.#scene.getObjectByName("MiiHead");
  }
  traverseAddFaceMaterial(node: THREE.Mesh, urlParams: string) {
    // Dispose of old head materials
    node.traverse((c) => {
      let child = c as THREE.Mesh;
      if (child.isMesh) {
        if (child.geometry.userData) {
          const data = child.geometry.userData as {
            cullMode: number;
            modulateColor: number[];
            modulateMode: number;
            modulateType: number;
          };
          if (data.modulateMode) {
            if (data.modulateType === 6) {
              // found face!!
              (async () => {
                const mat = child.material as THREE.MeshBasicMaterial;
                const oldMat = mat;

                const tex = await this.#textureLoader.loadAsync(
                  Config.renderer.renderFaceURL + urlParams
                );

                if (tex) {
                  // Initialize the texture on the GPU to prevent lag frames
                  tex.flipY = false;
                  this.#renderer.initTexture(tex);

                  child.material = new THREE.MeshStandardMaterial({
                    map: tex,
                    emissiveIntensity: 1,
                    transparent: true,
                    metalness: 1,
                    toneMapped: true,
                    alphaTest: 0.5,
                  });

                  // Now... Replace it with shader material
                  traverseMesh(child, this.mii);

                  oldMat.dispose();
                }
              })();
            }
          }
        }
      }
    });
  }

  // screenshot mode helper utils
  // also used for debugging
  getCamera() {
    return this.#camera;
  }
  getControls() {
    return this.#controls;
  }
  getScene() {
    return this.#scene;
  }
  getRenderer() {
    return this.#renderer;
  }

  shutdown() {
    Array.from(this.animators.keys()).forEach((k) => {
      this.animators.delete(k);
    });
  }
}
